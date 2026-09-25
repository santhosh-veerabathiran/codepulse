import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Account, F, Facts, SourceFileHandle } from '../types';
import { DatasetDb } from '../utils/dataset.db';
import { ProviderFetch } from '../utils/provider.fetch';
import { AccountStore } from './account';

@Injectable({ providedIn: 'root' })
export class FactsStore {
    private readonly accounts = inject(AccountStore);
    private readonly db = inject(DatasetDb);
    private readonly provider = inject(ProviderFetch);

    readonly facts = signal<Facts | undefined>(undefined);
    readonly error = signal<string>('');
    readonly loading = signal<boolean>(true);
    readonly fetching = signal<boolean>(false);
    readonly fetchMsg = signal<string>('');
    readonly needsSetup = computed<boolean>(() => {
        return !this.loading() && this.facts() === undefined && !this.error();
    });
    readonly ready = computed<boolean>(() => {
        return this.facts() !== undefined;
    });
    readonly latestDate = computed<string>(() => {
        const facts = this.facts();
        if (!facts) {
            return '';
        }
        let max = '';
        for (const row of facts.F) {
            const date = row[F.Date] as string;
            if (date > max) {
                max = date;
            }
        }
        return max;
    });

    private configMerged = false;

    constructor() {
        void this.bootstrap();
        effect(() => {
            const facts = this.facts();
            if (facts && (!facts.repoGroups || !facts.commitUrl) && !this.configMerged) {
                this.configMerged = true;
                void this.mergeConfig(facts);
            }
        });
    }

    private async mergeConfig(facts: Facts) {
        try {
            const config = (await fetch('assets/dashboard-config.json').then((r) => {
                return r.json();
            })) as { repoGroups?: Record<string, string>; commitUrl?: string };
            if (this.facts() === facts) {
                this.facts.set({ ...facts, repoGroups: facts.repoGroups ?? config.repoGroups, commitUrl: facts.commitUrl ?? config.commitUrl });
            }
        } catch {
            /* grouping stays "Other" and commit links stay hidden until the dataset carries them */
        }
    }

    async importFacts(account: Account, raw: unknown) {
        const facts = this.validate(raw);
        if (!facts) {
            this.error.set('That file is not a valid CodePulse snapshot (missing F / MR / roster fields).');
            return;
        }
        this.error.set('');
        this.loading.set(true);
        await this.db.put(account.id, facts);
        this.accounts.update(account.id, { dataAt: Date.now() });
        this.accounts.setActive(account.id);
        this.facts.set(facts);
        this.loading.set(false);
    }

    async importFromHandle(account: Account, handle: SourceFileHandle) {
        const file = await handle.getFile();
        const parsed = JSON.parse(await file.text());
        await this.importFacts(account, parsed);
        if (!this.error()) {
            await this.db.putHandle(account.id, handle);
            this.accounts.update(account.id, { sourceName: file.name });
        }
    }

    async refreshJson(account: Account): Promise<boolean> {
        const handle = await this.db.getHandle(account.id);
        if (!handle) {
            return false;
        }
        if (!(await this.ensureReadable(handle))) {
            this.error.set('Permission to read the saved file was declined.');
            return false;
        }
        try {
            await this.importFromHandle(account, handle);
            return !this.error();
        } catch {
            this.error.set('Could not read the saved file — it may have moved or been deleted. Choose it again.');
            return false;
        }
    }

    private async ensureReadable(handle: SourceFileHandle): Promise<boolean> {
        if (!handle.queryPermission || !handle.requestPermission) {
            return true;
        }
        const descriptor = { mode: 'read' } as const;
        if ((await handle.queryPermission(descriptor)) === 'granted') {
            return true;
        }
        return (await handle.requestPermission(descriptor)) === 'granted';
    }

    async refreshFromProvider(account: Account) {
        this.fetching.set(true);
        this.error.set('');
        try {
            const facts = await this.provider.fetch(account, (m) => {
                return this.fetchMsg.set(m);
            });
            await this.importFacts(account, facts);
        } catch (e) {
            this.error.set(e instanceof Error ? e.message : 'Provider fetch failed.');
        } finally {
            this.fetching.set(false);
            this.fetchMsg.set('');
        }
    }

    async switchAccount(id: string) {
        this.accounts.setActive(id);
        this.error.set('');
        this.loading.set(true);
        const facts = await this.db.get(id);
        this.facts.set(facts);
        this.loading.set(false);
    }

    async clearActiveData() {
        const id = this.accounts.activeId();
        if (!id) {
            return;
        }
        await this.db.delete(id);
        this.accounts.update(id, { dataAt: undefined });
        this.facts.set(undefined);
        this.error.set('');
        this.loading.set(false);
    }

    async removeAccount(id: string) {
        const wasActive = this.accounts.activeId() === id;
        await this.db.delete(id);
        this.accounts.remove(id);
        if (wasActive) {
            const next = this.accounts.activeId();
            if (next) {
                await this.switchAccount(next);
            } else {
                this.facts.set(undefined);
                this.error.set('');
                this.loading.set(false);
            }
        }
    }

    private async bootstrap() {
        const active = this.accounts.active();
        if (!active) {
            this.loading.set(false);
            return;
        }
        try {
            const facts = await this.db.get(active.id);
            this.facts.set(facts);
        } catch {
            this.error.set('Could not read the local data store.');
        }
        this.loading.set(false);
    }

    private validate(raw: unknown): Facts | undefined {
        const f = raw as Partial<Facts>;
        if (f && Array.isArray(f.F) && Array.isArray(f.MR) && Array.isArray(f.roster) && Array.isArray(f.repos)) {
            return f as Facts;
        }
        return undefined;
    }
}
