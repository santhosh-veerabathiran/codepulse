import { effect, inject, Injectable } from '@angular/core';
import { ALL, GranKind, LineCat, Period, PeriodKind } from '../types';
import { FiltersStore } from './filters';

@Injectable({ providedIn: 'root' })
export class FilterUrl {
    private readonly filters = inject(FiltersStore);
    private restoring = false;

    constructor() {
        this.restore();
        window.addEventListener('hashchange', () => {
            this.restore();
        });
        effect(() => {
            this.write();
        });
    }

    private write() {
        const filters = this.filters;
        const params = new URLSearchParams();
        if (filters.personId() !== ALL) {
            params.set('person', String(filters.personId()));
        }
        if (filters.repoSel().length) {
            params.set('repos', filters.repoSel().join(','));
        }
        const period = this.encodePeriod(filters.period());
        if (period) {
            params.set('period', period);
        }
        if (filters.sortKey() !== 'code') {
            params.set('rank', filters.sortKey());
        }
        if (filters.lineCat() !== LineCat.All) {
            params.set('lines', filters.lineCat());
        }
        if (filters.gran() !== GranKind.Auto) {
            params.set('group', filters.gran());
        }
        if (this.restoring) {
            return;
        }
        const query = params.toString();
        const base = (location.hash.split('?')[0] || '#/') as string;
        history.replaceState(null, '', query ? `${base}?${query}` : base);
    }

    private restore() {
        const hash = location.hash;
        const markIndex = hash.indexOf('?');
        if (markIndex < 0) {
            return;
        }
        const params = new URLSearchParams(hash.slice(markIndex + 1));
        this.restoring = true;
        const filters = this.filters;
        const person = params.get('person');
        filters.personId.set(person ? Number(person) : ALL);
        filters.repoSel.set(params.get('repos')?.split(',').filter(Boolean) ?? []);
        filters.period.set(this.decodePeriod(params.get('period')));
        filters.sortKey.set(params.get('rank') ?? 'code');
        filters.lineCat.set((params.get('lines') as LineCat) ?? LineCat.All);
        filters.gran.set((params.get('group') as GranKind) ?? GranKind.Auto);
        this.restoring = false;
    }

    private encodePeriod(period: Period): string {
        if (period.kind === PeriodKind.Year) {
            return period.year ?? '';
        }
        if (period.kind === PeriodKind.Rolling) {
            return `${period.days}d`;
        }
        if (period.kind === PeriodKind.Range) {
            return `${period.from ?? ''}~${period.to ?? ''}`;
        }
        return '';
    }

    private decodePeriod(value: string | null): Period {
        if (!value) {
            return { kind: PeriodKind.All };
        }
        if (/^\d{4}$/.test(value)) {
            return { kind: PeriodKind.Year, year: value };
        }
        if (/^\d+d$/.test(value)) {
            return { kind: PeriodKind.Rolling, days: Number(value.slice(0, -1)) };
        }
        if (value.includes('~')) {
            const [from, to] = value.split('~');
            return { kind: PeriodKind.Range, from: from || undefined, to: to || undefined };
        }
        return { kind: PeriodKind.All };
    }
}
