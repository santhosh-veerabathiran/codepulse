import { Injectable, computed, inject } from '@angular/core';
import { AF, ALL, Agg, BigCommit, Cell, F, Facts, MG, MR, MrState, OwnEntry, PersonId, RankRow } from '../types';
import { sortByKey } from '../constants/analytics';
import { FactsStore } from './facts';
import { FiltersStore } from './filters';

@Injectable({ providedIn: 'root' })
export class AnalyticsStore {
    private readonly factsStore = inject(FactsStore);
    private readonly filters = inject(FiltersStore);
    private readonly categoryNames = ['code', 'test', 'docs', 'config', 'deps', 'gen'];

    private median(values: number[]): number {
        if (!values.length) {
            return 0;
        }
        const sorted = [...values].sort((a, b) => {
            return a - b;
        });
        return sorted[Math.floor(sorted.length / 2)];
    }

    private makeAgg(id: number): Agg {
        return {
            id,
            commits: 0,
            additions: 0,
            deletions: 0,
            commentAdd: 0,
            codeAdd: 0,
            commentDel: 0,
            lineSum: 0,
            categories: {},
            days: 0,
            sizes: { median: 0, mean: 0, p75: 0, p90: 0 },
            merges: { count: 0, toMain: 0, toBranch: 0 },
            mergeRequests: { authored: 0, merged: 0, closed: 0, open: 0, upvotes: 0, reviewed: 0, selfMerged: 0, timeToMergeList: [], noteCountList: [], timeToMerge: undefined, noteCount: 0, rate: undefined },
        };
    }

    readonly agg = computed<Record<number, Agg>>(() => {
        return this.personAgg();
    });
    readonly ranked = computed<RankRow[]>(() => {
        return this.rankTeam();
    });
    readonly selectedCell = computed<Cell | null>(() => {
        return this.buildCell(this.filters.personId());
    });
    readonly ownership = computed<Record<string, OwnEntry>>(() => {
        return this.appOwn();
    });

    buildCell(pid: PersonId): Cell | null {
        const facts = this.factsStore.facts();
        if (!facts) {
            return null;
        }
        const f = this.filters;
        const pAll = pid === ALL;
        const P = pAll ? -1 : (pid as number);
        const cell: Cell = {
            ...this.makeAgg(P),
            year: {},
            month: {},
            types: {},
            scopes: {},
            byrepo: {},
            daily: {},
            dow: [0, 0, 0, 0, 0, 0, 0],
            range: ['', ''],
            series: { gran: f.childGran(), keys: [], data: {} },
            sizeList: [],
            mrYear: {},
            largest: [],
        };
        const series = cell.series.data;
        const sizes: number[] = [];
        const bigList: BigCommit[] = [];
        const days = new Set<string>();
        let min = '';
        let max = '';

        for (const row of facts.F) {
            if (!f.okRepo(row[F.Repo]) || (!pAll && row[F.Person] !== P) || !f.inScope(row[F.Date])) {
                continue;
            }
            const ln = f.lineVal(row);
            const date = row[F.Date];
            cell.commits++;
            cell.additions += row[F.Add];
            cell.deletions += row[F.Del];
            cell.lineSum += ln;
            cell.commentAdd += row[F.CmtAdd];
            cell.codeAdd += row[F.CodeAdd];
            cell.commentDel += row[F.CmtDel] || 0;
            for (let j = 0; j < 6; j++) {
                cell.categories[this.categoryNames[j]] = (cell.categories[this.categoryNames[j]] || 0) + (row[F.Code + j] as number);
            }
            days.add(date);
            cell.daily[date] = (cell.daily[date] || 0) + 1;
            cell.dow[(new Date(`${date}T00:00:00`).getDay() + 6) % 7]++;
            if (!min || date < min) {
                min = date;
            }
            if (!max || date > max) {
                max = date;
            }
            const y = date.slice(0, 4);
            const mo = date.slice(0, 7);
            (cell.year[y] = cell.year[y] || [0, 0, 0])[0]++;
            cell.year[y][1] += ln;
            cell.year[y][2] += row[F.Code];
            (cell.month[mo] = cell.month[mo] || [0, 0, 0])[0]++;
            cell.month[mo][1] += ln;
            cell.month[mo][2] += row[F.Code];
            const t = facts.types[row[F.Type]];
            (cell.types[t] = cell.types[t] || [0, 0])[0]++;
            cell.types[t][1] += ln;
            if (row[F.App] >= 0) {
                const app = facts.apps[row[F.App]];
                (cell.scopes[app] = cell.scopes[app] || [0, 0])[0]++;
                cell.scopes[app][1] += ln;
            }
            sizes.push(ln);
            if (row[F.Big] >= 0) {
                const cm = facts.CM[row[F.Big] as number];
                bigList.push({
                    lines: row[F.Add] + row[F.Del],
                    date,
                    kind: facts.types[row[F.Type]],
                    scope: row[F.App] >= 0 ? facts.apps[row[F.App]] : '',
                    title: cm?.[1] ?? '',
                    sha: cm?.[0] ?? '',
                    repo: facts.repos[row[F.Repo]],
                });
            }
            const rp = facts.repos[row[F.Repo]];
            (cell.byrepo[rp] = cell.byrepo[rp] || [0, 0, 0, 0])[0]++;
            cell.byrepo[rp][1] += ln;
            cell.byrepo[rp][2] += row[F.Code];
            const bk = f.bucketKey(date);
            (series[bk] = series[bk] || [0, 0, 0, 0, 0])[0]++;
            series[bk][1] += ln;
            series[bk][2] += row[F.Code];
        }

        for (const g of facts.MG) {
            if (!f.okRepo(g[MG.Repo]) || (!pAll && g[MG.Person] !== P) || !f.inScope(g[MG.Date])) {
                continue;
            }
            cell.merges.count++;
            if ((g[MG.Kind] || 0) === 1) {
                cell.merges.toBranch++;
            } else {
                cell.merges.toMain++;
            }
            const bk = f.bucketKey(g[MG.Date]);
            (series[bk] = series[bk] || [0, 0, 0, 0, 0])[3]++;
        }

        for (const m of facts.MR) {
            if (!f.okRepo(m[MR.Repo])) {
                continue;
            }
            const created = m[MR.Created];
            const state = m[MR.State];
            const author = m[MR.Author];
            const merger = m[MR.Merger];
            if (state === MrState.Merged && f.inScope(created) && (pAll || merger === P)) {
                cell.mergeRequests.reviewed++;
            }
            if (!(pAll || author === P) || !f.inScope(created)) {
                continue;
            }
            cell.mergeRequests.authored++;
            cell.mergeRequests.upvotes += m[MR.Up];
            cell.mergeRequests.noteCountList.push(m[MR.Notes]);
            const yr = (cell.mrYear[created.slice(0, 4)] = cell.mrYear[created.slice(0, 4)] || [0, 0, 0]);
            if (state === MrState.Merged) {
                cell.mergeRequests.merged++;
                yr[0]++;
                if (!pAll && merger === P) {
                    cell.mergeRequests.selfMerged++;
                }
                if (m[MR.Ttm] >= 0) {
                    cell.mergeRequests.timeToMergeList.push(m[MR.Ttm]);
                }
                const bk = f.bucketKey(created);
                (series[bk] = series[bk] || [0, 0, 0, 0, 0])[4]++;
            } else if (state === MrState.Closed) {
                cell.mergeRequests.closed++;
                yr[1]++;
            } else if (state === MrState.Opened) {
                cell.mergeRequests.open++;
                yr[2]++;
            }
        }

        if (!cell.commits && !cell.merges.count && !cell.mergeRequests.authored && !cell.mergeRequests.reviewed) {
            return null;
        }
        cell.range = [min, max];
        cell.days = days.size;
        cell.sizeList = sizes;
        cell.largest = bigList
            .sort((a, b) => {
                return b.lines - a.lines;
            })
            .slice(0, 8);
        this.finalize(cell, sizes);
        cell.scopes = Object.fromEntries(
            Object.entries(cell.scopes)
                .sort((a, b) => {
                    return b[1][0] - a[1][0];
                })
                .slice(0, 15),
        );
        cell.series.keys = Object.keys(series).sort();
        return cell;
    }

    private finalize(a: Agg, sizes: number[]) {
        const sz = sizes.sort((x, y) => {
            return x - y;
        });
        const pcv = (q: number): number => {
            return sz.length ? sz[Math.min(sz.length - 1, Math.floor(sz.length * q))] : 0;
        };
        const total = sz.reduce((x, y) => {
            return x + y;
        }, 0);
        a.sizes = {
            median: pcv(0.5),
            p75: pcv(0.75),
            p90: pcv(0.9),
            mean: sz.length ? Math.round((total / sz.length) * 10) / 10 : 0,
        };
        a.mergeRequests.rate = a.mergeRequests.merged + a.mergeRequests.closed ? Math.round((100 * a.mergeRequests.merged) / (a.mergeRequests.merged + a.mergeRequests.closed)) : undefined;
        a.mergeRequests.timeToMerge = a.mergeRequests.timeToMergeList.length ? Math.round(this.median(a.mergeRequests.timeToMergeList) * 10) / 10 : undefined;
        a.mergeRequests.noteCount = a.mergeRequests.noteCountList.length ? this.median(a.mergeRequests.noteCountList) : 0;
    }

    private personAgg(): Record<number, Agg> {
        const facts = this.factsStore.facts();
        if (!facts) {
            return {};
        }
        const f = this.filters;
        const A: Record<number, Agg> = {};
        const sizes: Record<number, number[]> = {};
        const days: Record<number, Set<string>> = {};
        const get = (p: number): Agg => {
            if (!A[p]) {
                A[p] = this.makeAgg(p);
                sizes[p] = [];
                days[p] = new Set<string>();
            }
            return A[p];
        };
        for (const row of facts.F) {
            if (!f.okRepo(row[F.Repo]) || !f.inScope(row[F.Date])) {
                continue;
            }
            const a = get(row[F.Person]);
            a.commits++;
            a.additions += row[F.Add];
            a.deletions += row[F.Del];
            a.commentAdd += row[F.CmtAdd];
            a.codeAdd += row[F.CodeAdd];
            a.commentDel += row[F.CmtDel] || 0;
            days[a.id].add(row[F.Date]);
            const ln = f.lineVal(row);
            sizes[a.id].push(ln);
            a.lineSum += ln;
            for (let j = 0; j < 6; j++) {
                a.categories[this.categoryNames[j]] = (a.categories[this.categoryNames[j]] || 0) + (row[F.Code + j] as number);
            }
        }
        for (const g of facts.MG) {
            if (!f.okRepo(g[MG.Repo]) || !f.inScope(g[MG.Date])) {
                continue;
            }
            const a = get(g[MG.Person]);
            a.merges.count++;
            if ((g[MG.Kind] || 0) === 1) {
                a.merges.toBranch++;
            } else {
                a.merges.toMain++;
            }
        }
        for (const m of facts.MR) {
            if (!f.okRepo(m[MR.Repo])) {
                continue;
            }
            if (m[MR.State] === MrState.Merged && f.inScope(m[MR.Created]) && m[MR.Merger] >= 0) {
                get(m[MR.Merger]).mergeRequests.reviewed++;
            }
            if (m[MR.Author] < 0 || !f.inScope(m[MR.Created])) {
                continue;
            }
            const a = get(m[MR.Author]);
            a.mergeRequests.authored++;
            if (m[MR.State] === MrState.Merged) {
                a.mergeRequests.merged++;
                if (m[MR.Merger] === m[MR.Author]) {
                    a.mergeRequests.selfMerged++;
                }
                if (m[MR.Ttm] >= 0) {
                    a.mergeRequests.timeToMergeList.push(m[MR.Ttm]);
                }
                a.mergeRequests.noteCountList.push(m[MR.Notes]);
            } else if (m[MR.State] === MrState.Closed) {
                a.mergeRequests.closed++;
            }
        }
        for (const key in A) {
            const a = A[key];
            a.days = days[a.id].size;
            this.finalize(a, sizes[a.id]);
        }
        return A;
    }

    private rankTeam(): RankRow[] {
        const facts = this.factsStore.facts();
        if (!facts) {
            return [];
        }
        const A = this.agg();
        const sort = sortByKey(this.filters.sortKey());
        const gv = (a: Agg): number => {
            return sort.gate && !sort.gate(a) ? Number.NEGATIVE_INFINITY : sort.value(a);
        };
        const rows: RankRow[] = [];
        for (const r of facts.roster) {
            const a = A[r.i];
            if (a) {
                rows.push({ id: r.i, name: r.name, value: sort.value(a), agg: a });
            }
        }
        rows.sort((x, y) => {
            return gv(y.agg) - gv(x.agg);
        });
        return rows;
    }

    private appOwn(): Record<string, OwnEntry> {
        const facts = this.factsStore.facts();
        if (!facts) {
            return {};
        }
        const f = this.filters;
        const S: Record<string, OwnEntry> = {};
        for (const a of facts.AF) {
            if (!f.okRepo(a[AF.Repo]) || !f.inScope(a[AF.Date]) || !a[AF.Lines]) {
                continue;
            }
            const app = facts.apps[a[AF.App]];
            const entry = (S[app] = S[app] || { total: 0, by: {} });
            entry.total += a[AF.Lines];
            entry.by[a[AF.Person]] = (entry.by[a[AF.Person]] || 0) + a[AF.Lines];
        }
        return S;
    }

    personName(id: PersonId): string {
        const facts = this.factsStore.facts();
        if (id === ALL || !facts) {
            return 'All contributors';
        }
        return facts.persons[id as number]?.name || '?';
    }

    // A person's full active date span within the selected repos, ignoring the
    // current period filter — so "Their span" reflects the person, not the view.
    personDateRange(id: PersonId): [string, string] {
        const facts = this.factsStore.facts();
        if (!facts || id === ALL) {
            return ['', ''];
        }
        const f = this.filters;
        let min = '';
        let max = '';
        for (const row of facts.F) {
            if (row[F.Person] !== id || !f.okRepo(row[F.Repo])) {
                continue;
            }
            const date = row[F.Date];
            if (!min || date < min) {
                min = date;
            }
            if (!max || date > max) {
                max = date;
            }
        }
        return [min, max];
    }
}
