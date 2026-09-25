import { Injectable, computed, inject, signal } from '@angular/core';
import { ALL, F, FactRow, GranKind, LineCat, Period, PeriodKind, PersonId } from '../types';
import { FactsStore } from './facts';

@Injectable({ providedIn: 'root' })
export class FiltersStore {
    private readonly factsStore = inject(FactsStore);

    readonly repoSel = signal<string[]>([]);
    readonly period = signal<Period>({ kind: PeriodKind.All });
    readonly personId = signal<PersonId>(ALL);
    readonly compareIds = signal<number[]>([]);
    readonly sortKey = signal<string>('code');
    readonly lineCat = signal<LineCat>(LineCat.All);
    readonly gran = signal<GranKind>(GranKind.Auto);
    readonly incMerge = signal<boolean>(false);

    readonly isDefault = computed<boolean>(() => {
        return (
            !this.repoSel().length &&
            this.period().kind === PeriodKind.All &&
            this.personId() === ALL &&
            !this.compareIds().length &&
            this.sortKey() === 'code' &&
            this.lineCat() === LineCat.All &&
            this.gran() === GranKind.Auto
        );
    });

    reset() {
        this.repoSel.set([]);
        this.period.set({ kind: PeriodKind.All });
        this.personId.set(ALL);
        this.compareIds.set([]);
        this.sortKey.set('code');
        this.lineCat.set(LineCat.All);
        this.gran.set(GranKind.Auto);
        this.incMerge.set(false);
    }

    private readonly allowedRepoIdx = computed<Set<number> | undefined>(() => {
        const sel = this.repoSel();
        const facts = this.factsStore.facts();
        if (!sel.length || !facts) {
            return undefined;
        }
        const set = new Set<number>();
        facts.repos.forEach((r, i) => {
            if (sel.includes(r)) {
                set.add(i);
            }
        });
        return set;
    });

    okRepo(repoIdx: number): boolean {
        const allowed = this.allowedRepoIdx();
        return allowed === undefined || allowed.has(repoIdx);
    }

    inScope(date: string): boolean {
        const p = this.period();
        if (p.kind === PeriodKind.All) {
            return true;
        }
        if (p.kind === PeriodKind.Range) {
            return (!p.from || date >= p.from) && (!p.to || date <= p.to);
        }
        if (p.kind === PeriodKind.Rolling) {
            const anchor = this.factsStore.latestDate();
            if (!anchor || !p.days) {
                return true;
            }
            return date > this.daysBefore(anchor, p.days) && date <= anchor;
        }
        return date.slice(0, 4) === p.year;
    }

    private daysBefore(iso: string, days: number): string {
        const date = new Date(`${iso}T00:00:00`);
        date.setDate(date.getDate() - days);
        return date.toISOString().slice(0, 10);
    }

    private readonly lineValue: Record<LineCat, (row: FactRow) => number> = {
        [LineCat.All]: (row) => {
            return row[F.Add] + row[F.Del];
        },
        [LineCat.Code]: (row) => {
            return row[F.Code];
        },
        [LineCat.CodeWithComments]: (row) => {
            return row[F.CodeAdd] + row[F.CmtAdd];
        },
        [LineCat.CodeNoComments]: (row) => {
            return row[F.CodeAdd];
        },
        [LineCat.Comments]: (row) => {
            return row[F.CmtAdd];
        },
        [LineCat.CommentsNet]: (row) => {
            return row[F.CmtAdd] - (row[F.CmtDel] || 0);
        },
        [LineCat.Test]: (row) => {
            return row[F.Test];
        },
        [LineCat.Docs]: (row) => {
            return row[F.Docs];
        },
        [LineCat.Config]: (row) => {
            return row[F.Config];
        },
        [LineCat.Deps]: (row) => {
            return row[F.Deps];
        },
        [LineCat.Gen]: (row) => {
            return row[F.Gen];
        },
    };

    lineVal(row: FactRow): number {
        return this.lineValue[this.lineCat()](row);
    }

    childGran(): GranKind {
        const chosen = this.gran();
        if (chosen !== GranKind.Auto) {
            return chosen;
        }
        return this.period().kind === PeriodKind.All ? GranKind.Year : GranKind.Month;
    }

    private readonly bucketOf: Record<GranKind, (date: string) => string> = {
        [GranKind.Auto]: (date) => {
            return date.slice(0, 7);
        },
        [GranKind.Year]: (date) => {
            return date.slice(0, 4);
        },
        [GranKind.Month]: (date) => {
            return date.slice(0, 7);
        },
        [GranKind.Week]: (date) => {
            return this.isoWeekKey(date);
        },
        [GranKind.Day]: (date) => {
            return date;
        },
    };

    bucketKey(date: string): string {
        return this.bucketOf[this.childGran()](date);
    }

    private isoWeekKey(date: string): string {
        const day = new Date(`${date}T00:00:00`);
        const thursday = new Date(day);
        thursday.setDate(day.getDate() - ((day.getDay() + 6) % 7) + 3);
        const firstThursday = new Date(thursday.getFullYear(), 0, 4);
        const week = 1 + Math.round(((thursday.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7);
        return `${thursday.getFullYear()}-W${String(week).padStart(2, '0')}`;
    }

    periodLabel(): string {
        const p = this.period();
        if (p.preset === 'ytd') {
            return 'Year to date';
        }
        if (p.kind === PeriodKind.Year) {
            return p.year ?? '';
        }
        if (p.kind === PeriodKind.Range) {
            return `${p.from || '…'} → ${p.to || '…'}`;
        }
        if (p.kind === PeriodKind.Rolling) {
            return `Last ${p.days} days`;
        }
        return 'All time';
    }
}
