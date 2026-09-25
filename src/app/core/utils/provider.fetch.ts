import { Injectable } from '@angular/core';
import { CONVENTIONAL_COMMIT_RE, KNOWN_TYPES } from '../constants/data';
import { Account, Facts, RawCommit, RawMr, SourceKind } from '../types';
import { categorizeChanges } from './categorize';

// Per-commit detail calls (needed for line stats) are one request each, so cap how
// many we make against a repo to stay well inside the API rate limit on large repos.
const GITHUB_STATS_CAP = 400;

@Injectable({ providedIn: 'root' })
export class ProviderFetch {
    async fetch(account: Account, onProgress?: (message: string) => void): Promise<Facts> {
        const note = (m: string) => {
            if (onProgress) {
                onProgress(m);
            }
        };
        if (account.kind === SourceKind.GitLab) {
            return this.fetchGitLab(account, note);
        }
        if (account.kind === SourceKind.GitHub) {
            return this.fetchGitHub(account, note);
        }
        throw new Error('This workspace is not connected to a provider.');
    }

    private async fetchGitLab(account: Account, note: (m: string) => void): Promise<Facts> {
        const host = (account.host || 'gitlab.com').replace(/^https?:\/\//, '').replace(/\/$/, '');
        const base = `https://${host}/api/v4`;
        const headers = { 'PRIVATE-TOKEN': account.token || '' };
        const commits: RawCommit[] = [];
        const mrs: RawMr[] = [];
        for (const repo of account.repos || []) {
            note(`GitLab: ${repo}`);
            const id = encodeURIComponent(repo);
            const cs = await this.pageAll(`${base}/projects/${id}/repository/commits?with_stats=true&per_page=100`, headers);
            for (const c of cs) {
                commits.push(this.normalizeGitLabCommit(c as Record<string, any>, repo));
            }
            const ms = await this.pageAll(`${base}/projects/${id}/merge_requests?scope=all&state=all&per_page=100`, headers);
            for (const m of ms) {
                mrs.push(this.normalizeGitLabMr(m as Record<string, any>, repo));
            }
        }
        return this.assemble(commits, mrs);
    }

    private async fetchGitHub(account: Account, note: (m: string) => void): Promise<Facts> {
        const base = (account.host ? `https://${account.host.replace(/^https?:\/\//, '')}/api/v3` : 'https://api.github.com').replace(/\/$/, '');
        const headers = { Authorization: `Bearer ${account.token || ''}`, Accept: 'application/vnd.github+json' };
        const commits: RawCommit[] = [];
        const mrs: RawMr[] = [];
        for (const repo of account.repos || []) {
            note(`GitHub: ${repo} — listing commits`);
            const cs = await this.pageAll(`${base}/repos/${repo}/commits?per_page=100`, headers);
            let statted = 0;
            for (const c of cs) {
                const raw = c as Record<string, any>;
                const isMerge = (raw['parents'] || []).length > 1;
                let detail: Record<string, any> | undefined;
                if (!isMerge && statted < GITHUB_STATS_CAP) {
                    detail = await this.fetchOne(`${base}/repos/${repo}/commits/${raw['sha']}`, headers);
                    if (detail) {
                        statted++;
                        if (statted % 25 === 0) {
                            note(`GitHub: ${repo} — line stats for ${statted} commits`);
                        }
                    }
                }
                commits.push(this.normalizeGitHubCommit(raw, repo, detail));
            }
            note(`GitHub: ${repo} — pull requests`);
            const ps = await this.pageAll(`${base}/repos/${repo}/pulls?state=all&per_page=100`, headers);
            for (const p of ps) {
                mrs.push(this.normalizeGitHubPr(p as Record<string, any>, repo));
            }
        }
        return this.assemble(commits, mrs);
    }

    private async fetchOne(url: string, headers: Record<string, string>): Promise<Record<string, any> | undefined> {
        const res = await fetch(url, { headers });
        if (!res.ok) {
            return undefined;
        }
        return (await res.json()) as Record<string, any>;
    }

    private async pageAll(url: string, headers: Record<string, string>): Promise<unknown[]> {
        const out: unknown[] = [];
        let next: string | undefined = url;
        let guard = 0;
        while (next && guard < 200) {
            guard++;
            const res: Response = await fetch(next, { headers });
            if (!res.ok) {
                throw new Error(`Provider request failed (${res.status}). Check the token scope and repo paths.`);
            }
            const batch = (await res.json()) as unknown[];
            out.push(...batch);
            next = this.nextLink(res.headers.get('link') ?? undefined);
        }
        return out;
    }

    private nextLink(link?: string): string | undefined {
        if (!link) {
            return;
        }
        const match = link.split(',').find((p) => {
            return p.includes('rel="next"');
        });
        if (!match) {
            return;
        }
        const found = match.match(/<([^>]+)>/);
        return found ? found[1] : undefined;
    }

    private typeOf(title: string): string {
        const m = title.match(CONVENTIONAL_COMMIT_RE);
        if (m && KNOWN_TYPES.includes(m[1].toLowerCase())) {
            return m[1].toLowerCase();
        }
        return 'other';
    }

    private normalizeGitLabCommit(c: Record<string, any>, repo: string): RawCommit {
        const stats = c['stats'] || {};
        const title = String(c['title'] || c['message'] || '');
        return {
            date: String(c['created_at'] || '').slice(0, 10),
            authorKey: (c['author_email'] || c['author_name'] || '?').toLowerCase(),
            authorName: String(c['author_name'] || '?'),
            repo,
            add: Number(stats['additions'] || 0),
            del: Number(stats['deletions'] || 0),
            type: this.typeOf(title),
            merge: (c['parent_ids'] || []).length > 1,
            sha: String(c['id'] || ''),
            title,
        };
    }

    private normalizeGitLabMr(m: Record<string, any>, repo: string): RawMr {
        const created = String(m['created_at'] || '').slice(0, 10);
        const mergedAt = m['merged_at'] ? String(m['merged_at']).slice(0, 10) : '';
        const state = m['state'] === 'merged' ? 0 : m['state'] === 'closed' ? 1 : 2;
        const ttm = m['merged_at'] && m['created_at'] ? (new Date(m['merged_at']).getTime() - new Date(m['created_at']).getTime()) / 3.6e6 : -1;
        return {
            created,
            merged: mergedAt,
            authorKey: (m['author']?.['username'] || '?').toLowerCase(),
            authorName: String(m['author']?.['name'] || '?'),
            repo,
            state,
            mergerKey: (m['merged_by']?.['username'] || '').toLowerCase(),
            ttm: Math.round(ttm * 10) / 10,
        };
    }

    private normalizeGitHubCommit(c: Record<string, any>, repo: string, detail?: Record<string, any>): RawCommit {
        const title = String(c['commit']?.['message'] || '').split('\n')[0];
        const stats = detail?.['stats'] || {};
        const files = detail?.['files'] as { filename?: string; additions?: number; deletions?: number }[] | undefined;
        return {
            date: String(c['commit']?.['author']?.['date'] || '').slice(0, 10),
            authorKey: (c['author']?.['login'] || c['commit']?.['author']?.['email'] || '?').toLowerCase(),
            authorName: String(c['commit']?.['author']?.['name'] || '?'),
            repo,
            add: Number(stats['additions'] || 0),
            del: Number(stats['deletions'] || 0),
            cats: files ? categorizeChanges(files) : undefined,
            type: this.typeOf(title),
            merge: (c['parents'] || []).length > 1,
            sha: String(c['sha'] || ''),
            title,
        };
    }

    private normalizeGitHubPr(p: Record<string, any>, repo: string): RawMr {
        const created = String(p['created_at'] || '').slice(0, 10);
        const mergedAt = p['merged_at'] ? String(p['merged_at']).slice(0, 10) : '';
        const state = p['merged_at'] ? 0 : p['state'] === 'closed' ? 1 : 2;
        const ttm = p['merged_at'] && p['created_at'] ? (new Date(p['merged_at']).getTime() - new Date(p['created_at']).getTime()) / 3.6e6 : -1;
        return {
            created,
            merged: mergedAt,
            authorKey: (p['user']?.['login'] || '?').toLowerCase(),
            authorName: String(p['user']?.['login'] || '?'),
            repo,
            state,
            mergerKey: (p['merged_by']?.['login'] || '').toLowerCase(),
            ttm: Math.round(ttm * 10) / 10,
        };
    }

    private assemble(commits: RawCommit[], mrs: RawMr[]): Facts {
        const repos = [
            ...new Set([
                ...commits.map((c) => {
                    return c.repo;
                }),
                ...mrs.map((m) => {
                    return m.repo;
                }),
            ]),
        ].sort();
        const repoIdx = new Map(
            repos.map((r, i) => {
                return [r, i];
            }),
        );
        const persons = new Map<string, { name: string; idx: number }>();
        const personIdx = (key: string, name: string): number => {
            let p = persons.get(key);
            if (!p) {
                p = { name, idx: persons.size };
                persons.set(key, p);
            }
            return p.idx;
        };
        const types = KNOWN_TYPES;
        const typeIdx = new Map(
            types.map((t, i) => {
                return [t, i];
            }),
        );
        const F: (string | number)[][] = [];
        const MG: (string | number)[][] = [];
        const CM: [string, string][] = [];
        const commitCount: Record<number, number> = {};
        const years = new Set<string>();
        for (const c of commits) {
            if (!c.date) {
                continue;
            }
            years.add(c.date.slice(0, 4));
            const pi = personIdx(c.authorKey, c.authorName);
            const ri = repoIdx.get(c.repo) ?? 0;
            if (c.merge) {
                MG.push([c.date, pi, ri, 0]);
                continue;
            }
            const cats = c.cats ?? [c.add, 0, 0, 0, 0, 0];
            const big = c.add + c.del >= 400 ? CM.length : -1;
            if (big >= 0) {
                CM.push([c.sha, c.title]);
            }
            F.push([c.date, pi, ri, typeIdx.get(c.type) ?? 11, -1, c.add, c.del, cats[0], cats[1], cats[2], cats[3], cats[4], cats[5], 0, cats[0], big, 0, 0]);
            commitCount[pi] = (commitCount[pi] || 0) + 1;
        }
        const MR: (string | number)[][] = [];
        for (const m of mrs) {
            if (!m.created) {
                continue;
            }
            const ai = personIdx(m.authorKey, m.authorName);
            const ri = repoIdx.get(m.repo) ?? 0;
            const merger = m.mergerKey ? personIdx(m.mergerKey, m.mergerKey) : -1;
            MR.push([m.created, m.merged, ai, ri, m.state, 0, m.ttm, 0, merger, -1]);
        }
        const roster = [...persons.entries()]
            .map(([, p]) => {
                return { i: p.idx, name: p.name, c: commitCount[p.idx] || 0 };
            })
            .sort((a, b) => {
                return b.c - a.c;
            });
        const personList = [...persons.values()]
            .sort((a, b) => {
                return a.idx - b.idx;
            })
            .map((p) => {
                return { name: p.name, gh: null, aliases: [], repos: [] };
            });
        const sumField = (index: number) => {
            return F.reduce((s, r) => {
                return s + (r[index] as number);
            }, 0);
        };
        const grand = {
            commits: F.length,
            lines: sumField(5) + sumField(6),
            code: sumField(7),
            cmt: 0,
            cadd: sumField(7),
            merges: MG.length,
            mrs: MR.filter((r) => {
                return r[4] === 0;
            }).length,
            contributors: persons.size,
        };
        return {
            repos,
            types,
            scopes: [],
            apps: [],
            appKind: [],
            persons: personList,
            roster,
            me: -1,
            years: [...years].sort(),
            grand,
            F: F as Facts['F'],
            CM,
            MG: MG as Facts['MG'],
            MR: MR as Facts['MR'],
            MM: [],
            AF: [],
            bigmin: 400,
        };
    }
}
