import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ALL, AnalyticsStore, FactsStore, FiltersStore, GRAN_LABEL, GranKind, LINE_LABEL, LineCat, PeriodKind, SORTS } from '../core';
import { DatePickerComponent } from './date.picker.component';
import { SelectComponent } from './select.component';
import { Chip, SelectOption } from './types';

@Component({
    selector: 'cp-filter-bar',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [SelectComponent, DatePickerComponent],
    template: `
        <div class="bar card">
            <cp-select class="field" label="Repositories" [multi]="true" allLabel="All repos" [options]="repoOpts()" [selected]="repoSel()" (picked)="toggleRepo($event)" (groupPicked)="toggleGroup($event)" />
            <cp-select class="field" label="Period" [options]="periodOpts()" [value]="periodValue()" (picked)="setPeriod($event)" />
            @if (personSpan()) {
                <button type="button" class="span" (click)="setSpan()" title="Scope the period to this person's first → last commit">⏱ Their span</button>
            }
            @if (periodValue() === 'range') {
                <div class="field">
                    <span class="flabel">Date range</span>
                    <div class="range">
                        <cp-date-picker placeholder="From" [value]="rangeFrom()" (picked)="setFrom($event)" />
                        <span class="rsep">→</span>
                        <cp-date-picker placeholder="To" [value]="rangeTo()" (picked)="setTo($event)" />
                    </div>
                </div>
            }
            <cp-select class="field" label="Rank team by" [options]="sortOpts()" [value]="sortKey()" (picked)="setSort($event)" />
            <cp-select class="field" label="Lines by category" [options]="lineOpts()" [value]="lineCat()" (picked)="setLineCat($event)" />
            <cp-select class="field" label="Group Timeline By" [options]="granOpts()" [value]="gran()" (picked)="setGran($event)" />
        </div>
        @if (chips().length) {
            <div class="chips">
                @for (c of chips(); track c.key) {
                    <span class="chip">
                        <span class="k">{{ c.key }}</span>
                        <b>{{ c.value }}</b>
                        <button type="button" class="x" (click)="c.clear()" [attr.aria-label]="'Remove ' + c.key + ' filter'">✕</button>
                    </span>
                }
                <button type="button" class="clr" (click)="clear()">Clear filters</button>
            </div>
        }
    `,
    styles: `
        :host {
            display: block;
        }
        .bar {
            display: flex;
            flex-wrap: wrap;
            gap: 18px;
            align-items: flex-end;
            background: var(--glass, var(--surface));
            border: 1px solid var(--glass-brd, var(--line));
            border-radius: var(--radius, 14px);
            padding: 14px 16px;
            /* No backdrop-filter here: it creates a stacking context that would
               trap the absolutely-positioned select/date-picker dropdown panels. */
            -webkit-backdrop-filter: none;
            backdrop-filter: none;
        }
        .field {
            min-width: 172px;
        }
        .chips {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            padding: 12px 2px 0;
        }
        .chip {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: var(--acc-soft);
            border: 1px solid var(--acc-line, var(--acc));
            color: var(--acc-ink, var(--acc));
            border-radius: 9px;
            padding: 5px 6px 5px 12px;
            font: 600 12px var(--font);
        }
        .chip .k {
            opacity: 0.7;
            font: 700 9.5px var(--font);
            letter-spacing: 0.05em;
        }
        .chip b {
            font-weight: 800;
        }
        .chip .x {
            width: 18px;
            height: 18px;
            border: 0;
            border-radius: 6px;
            display: grid;
            place-items: center;
            background: var(--acc);
            color: var(--acc-ink-on, #fff);
            cursor: pointer;
            font-size: 10px;
        }
        .chip .x:hover {
            filter: brightness(1.1);
        }
        .clr {
            background: var(--surface);
            border: 1px solid var(--line);
            color: var(--muted);
            border-radius: 9px;
            padding: 5px 13px;
            font: 700 12px var(--font);
            cursor: pointer;
        }
        .clr:hover {
            border-color: var(--bad, var(--acc));
            color: var(--bad, var(--acc));
        }
        .span {
            align-self: flex-end;
            background: var(--surface-2);
            border: 1px solid var(--line);
            color: var(--ink-2, var(--ink));
            border-radius: 10px;
            padding: 9px 12px;
            font: 700 12px var(--font);
            cursor: pointer;
            white-space: nowrap;
            transition: 0.13s;
        }
        .span:hover {
            border-color: var(--acc);
            color: var(--acc-ink, var(--acc));
        }
        .field.repos {
            flex: 1;
        }
        .flabel {
            font: 700 10px var(--font);
            letter-spacing: 0.05em;
            color: var(--muted);
            display: block;
            margin-bottom: 6px;
        }
        .range {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .range input {
            background: var(--surface-2);
            color: var(--ink);
            border: 1px solid var(--line);
            border-radius: 10px;
            padding: 9px 10px;
            font: 600 12px var(--font);
            outline: none;
        }
        .range input:focus {
            border-color: var(--acc);
        }
        .rsep {
            color: var(--muted);
        }
        .seg-field {
            display: flex;
            flex-direction: column;
        }
        .seg {
            display: inline-flex;
            background: var(--surface-2);
            border: 1px solid var(--line);
            border-radius: 10px;
            padding: 3px;
            gap: 2px;
        }
        .seg button {
            border: 0;
            background: none;
            color: var(--muted);
            padding: 7px 13px;
            border-radius: 7px;
            font: 700 12px var(--font);
            cursor: pointer;
            transition: 0.12s;
        }
        .seg button.on {
            background: var(--acc);
            color: #04121c;
        }
    `,
})
export class FilterBarComponent {
    private readonly factsStore = inject(FactsStore);
    private readonly filters = inject(FiltersStore);
    private readonly analytics = inject(AnalyticsStore);

    protected readonly repoSel = this.filters.repoSel;
    protected readonly sortKey = this.filters.sortKey;
    protected readonly lineCat = this.filters.lineCat;
    protected readonly gran = this.filters.gran;
    protected readonly incMerge = this.filters.incMerge;

    protected readonly chips = computed<Chip[]>(() => {
        const filters = this.filters;
        const out: Chip[] = [];
        if (filters.personId() !== ALL) {
            out.push({ key: 'Person', value: this.analytics.personName(filters.personId()), clear: () => filters.personId.set(ALL) });
        }
        const repos = filters.repoSel();
        if (repos.length) {
            out.push({ key: 'Repos', value: repos.length === 1 ? repos[0] : `${repos.length} selected`, clear: () => filters.repoSel.set([]) });
        }
        if (filters.period().kind !== PeriodKind.All) {
            out.push({ key: 'Period', value: filters.periodLabel(), clear: () => filters.period.set({ kind: PeriodKind.All }) });
        }
        return out;
    });
    protected readonly rangeFrom = computed<string>(() => {
        return this.filters.period().from ?? '';
    });
    protected readonly rangeTo = computed<string>(() => {
        return this.filters.period().to ?? '';
    });

    protected readonly repoOpts = computed<SelectOption[]>(() => {
        const facts = this.factsStore.facts();
        const repos = facts?.repos ?? [];
        const groups = facts?.repoGroups ?? {};
        return [...repos]
            .map((r) => {
                return { value: r, label: r, group: groups[r] ?? 'Other' };
            })
            .sort((a, b) => {
                return a.group.localeCompare(b.group) || a.label.localeCompare(b.label);
            });
    });
    protected readonly sortOpts = computed<SelectOption[]>(() => {
        return SORTS.map((s) => {
            return { value: s.key, label: s.label, hint: s.group };
        });
    });
    protected readonly lineOpts = computed<SelectOption[]>(() => {
        return (Object.keys(LINE_LABEL) as LineCat[]).map((v) => {
            return { value: v, label: LINE_LABEL[v] };
        });
    });
    protected readonly granOpts = computed<SelectOption[]>(() => {
        return (Object.keys(GRAN_LABEL) as GranKind[]).map((v) => {
            return { value: v, label: GRAN_LABEL[v] };
        });
    });
    protected readonly periodOpts = computed<SelectOption[]>(() => {
        const years = [...(this.factsStore.facts()?.years ?? [])].reverse().map((y) => {
            return { value: y, label: y };
        });
        return [
            { value: 'all', label: 'All time' },
            { value: '7d', label: 'Last 7 days' },
            { value: '15d', label: 'Last 15 days' },
            { value: '30d', label: 'Last 30 days' },
            { value: '90d', label: 'Last 90 days' },
            { value: 'ytd', label: 'Year to date' },
            ...years,
            { value: 'range', label: 'Custom range…' },
        ];
    });

    protected readonly periodValue = computed<string>(() => {
        const p = this.filters.period();
        if (p.preset) {
            return p.preset;
        }
        if (p.kind === PeriodKind.All) {
            return 'all';
        }
        if (p.kind === PeriodKind.Range) {
            return 'range';
        }
        if (p.kind === PeriodKind.Rolling) {
            return `${p.days}d`;
        }
        return p.year || 'all';
    });

    protected toggleRepo(repo: string) {
        const sel = this.repoSel();
        this.filters.repoSel.set(
            sel.includes(repo)
                ? sel.filter((r) => {
                      return r !== repo;
                  })
                : [...sel, repo],
        );
    }

    protected toggleGroup(values: string[]) {
        const sel = this.repoSel();
        const allOn = values.every((v) => {
            return sel.includes(v);
        });
        if (allOn) {
            this.filters.repoSel.set(
                sel.filter((r) => {
                    return !values.includes(r);
                }),
            );
        } else {
            this.filters.repoSel.set([...new Set([...sel, ...values])]);
        }
    }

    protected setPeriod(value: string) {
        if (value === 'all') {
            this.filters.period.set({ kind: PeriodKind.All });
        } else if (value === 'range') {
            this.filters.period.set({ kind: PeriodKind.Range });
        } else if (value === 'ytd') {
            const latest = this.factsStore.latestDate();
            const year = (latest || new Date().toISOString()).slice(0, 4);
            this.filters.period.set({ kind: PeriodKind.Range, from: `${year}-01-01`, to: latest || undefined, preset: 'ytd' });
        } else if (value.endsWith('d')) {
            this.filters.period.set({ kind: PeriodKind.Rolling, days: Number(value.slice(0, -1)) });
        } else {
            this.filters.period.set({ kind: PeriodKind.Year, year: value });
        }
    }

    protected setFrom(value: string) {
        this.filters.period.set({ kind: PeriodKind.Range, from: value || undefined, to: this.filters.period().to });
    }

    protected setTo(value: string) {
        this.filters.period.set({ kind: PeriodKind.Range, from: this.filters.period().from, to: value || undefined });
    }

    protected setSort(value: string) {
        this.filters.sortKey.set(value);
    }

    protected setLineCat(value: string) {
        this.filters.lineCat.set(value as LineCat);
    }

    protected setGran(value: string) {
        this.filters.gran.set(value as GranKind);
    }

    protected clear() {
        this.filters.reset();
    }

    protected readonly personSpan = computed<[string, string] | undefined>(() => {
        if (this.filters.personId() === ALL) {
            return undefined;
        }
        const range = this.analytics.personDateRange(this.filters.personId());
        return range[0] ? range : undefined;
    });

    protected setSpan() {
        const range = this.personSpan();
        if (range) {
            this.filters.period.set({ kind: PeriodKind.Range, from: range[0], to: range[1] });
        }
    }

    protected setMerge(on: boolean) {
        this.filters.incMerge.set(on);
    }
}
