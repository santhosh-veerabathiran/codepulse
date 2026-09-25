import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ALL, AnalyticsStore, FactsStore, FiltersStore, formatCompact, OwnContrib, OwnRow, percent } from '../core';
import { ChartToggleComponent } from './chart.toggle.component';
import { ReplayDirective } from './replay.directive';
import { ChartKind } from './types';

@Component({
    selector: 'cp-ownership',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgTemplateOutlet, ChartToggleComponent, ReplayDirective],
    template: `
        <div class="head">
            <div>
                <p class="eyebrow">Service Ownership</p>
                <h2>{{ personMode() ? name() + ' — Where They Own the Code' : 'Bus Factor &amp; Ownership' }}</h2>
            </div>
            <div class="ctrls">
                <cp-chart-toggle [kinds]="kinds" [value]="barKind()" (picked)="setKind($event)" />
                <input class="search" placeholder="Filter services…" [value]="query()" (input)="query.set($any($event.target).value)" />
            </div>
        </div>

        @if (!apps().length && !libs().length) {
            <p class="empty card">No code in this view.</p>
        }

        @if (apps().length) {
            <p class="grp">
                Applications <span class="ct">{{ appsTotal() }}</span>
            </p>
            <div class="card list" *cpReplay="viewKey()">
                @for (r of apps(); track r.name) {
                    <ng-container [ngTemplateOutlet]="rowTpl" [ngTemplateOutletContext]="{ r: r }" />
                }
                @if (appsTotal() > cap) {
                    <button type="button" class="more" (click)="toggleApps()">{{ appsExp() ? 'Show Top ' + cap : 'Show All ' + appsTotal() + ' Applications' }}</button>
                }
            </div>
        }

        @if (libs().length) {
            <p class="grp">
                Libraries &amp; shared <span class="ct">{{ libsTotal() }}</span>
            </p>
            <div class="card list" *cpReplay="viewKey()">
                @for (r of libs(); track r.name) {
                    <ng-container [ngTemplateOutlet]="rowTpl" [ngTemplateOutletContext]="{ r: r }" />
                }
                @if (libsTotal() > cap) {
                    <button type="button" class="more" (click)="toggleLibs()">{{ libsExp() ? 'Show Top ' + cap : 'Show All ' + libsTotal() + ' Libraries' }}</button>
                }
            </div>
        }

        <ng-template #rowTpl let-r="r">
            <div class="row" [class.exp]="expanded() === r.name" (click)="toggle(r.name)" [title]="r.name + ' — top owner ' + r.right + (r.fragile ? ' · fragile: one person owns ≥70%' : '') + ' · click for full split'">
                <div class="rn mono" [title]="r.name">
                    {{ r.name }}
                    @if (r.fragile) {
                        <span class="flag">fragile</span>
                    }
                </div>
                <div class="track" [class.lolli]="barKind() === Kind.Dots"><i [style.width.%]="r.percent" [style.background]="r.color"></i></div>
                <div class="rv">{{ r.right }}</div>
                <span class="chev">{{ expanded() === r.name ? '▾' : '▸' }}</span>
            </div>
            @if (expanded() === r.name) {
                <div class="breakdown">
                    <div class="donut-wrap">
                        <div class="donut" [style.background]="donutStops(r.contribs)">
                            <div class="dhole">
                                <b>{{ r.contribs.length }}</b
                                ><small>people</small>
                            </div>
                        </div>
                    </div>
                    <div class="bd-list">
                        @for (c of r.contribs; track c.id; let i = $index) {
                            <div class="bd" [title]="c.name + ' — ' + c.share.toFixed(1) + '% · ' + format(c.lines) + ' lines'">
                                <span class="sw" [style.background]="cColor(i)"></span>
                                <span class="bd-n">{{ c.name }}</span>
                                <div class="bd-track"><i [style.width.%]="c.share" [style.background]="cColor(i)"></i></div>
                                <span class="bd-v"
                                    >{{ c.share.toFixed(0) }}%<em>{{ format(c.lines) }}</em></span
                                >
                            </div>
                        }
                    </div>
                </div>
            }
        </ng-template>
    `,
    styles: `
        :host {
            display: block;
        }
        .head {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 16px;
            flex-wrap: wrap;
        }
        .eyebrow {
            font: 700 10px var(--font);
            letter-spacing: 0.08em;
            color: var(--muted);
            margin: 0 0 3px;
        }
        h2 {
            font: 800 22px var(--font-d);
            margin: 0;
            color: var(--ink);
        }
        .sub {
            font-size: 12.5px;
            color: var(--muted);
            margin: 4px 0 0;
            max-width: 70ch;
        }
        .ctrls {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
        }
        .search {
            background: var(--surface-2);
            color: var(--ink);
            border: 1px solid var(--line);
            border-radius: 9px;
            padding: 9px 13px;
            font: 500 12.5px var(--font);
            min-width: 200px;
            outline: none;
        }
        .search:focus {
            border-color: var(--acc);
        }
        .grp {
            font: 700 11px var(--font);
            letter-spacing: 0.05em;
            color: var(--muted);
            margin: 18px 0 8px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .ct {
            font-size: 10px;
            background: var(--surface-2);
            color: var(--muted);
            padding: 2px 7px;
            border-radius: 20px;
        }
        .card {
            background: var(--glass, var(--surface));
            border: 1px solid var(--glass-brd, var(--line));
            border-radius: var(--radius, 14px);
        }
        .list {
            padding: 6px;
        }
        .list.scroll {
            max-height: 792px;
            overflow-y: auto;
        }
        .list.scroll::-webkit-scrollbar {
            width: 8px;
        }
        .list.scroll::-webkit-scrollbar-thumb {
            background: var(--line);
            border-radius: 8px;
        }
        .scrollhint {
            font-size: 10px;
            color: var(--muted);
            text-transform: none;
            letter-spacing: 0;
            font-weight: 500;
            margin-left: 4px;
        }
        .row {
            display: grid;
            grid-template-columns: 230px 1fr 130px 16px;
            align-items: center;
            gap: 12px;
            padding: 9px 10px;
            border-radius: 9px;
            cursor: pointer;
            transition: background 0.12s;
        }
        .row:hover {
            background: var(--surface-2);
        }
        .row.exp {
            background: var(--surface-2);
        }
        .rn {
            font: 600 12.5px var(--mono);
            color: var(--ink);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .flag {
            font: 700 8.5px var(--font);
            letter-spacing: 0.04em;
            color: var(--bad, #ef4444);
            border: 1px solid color-mix(in srgb, var(--bad, #ef4444) 45%, transparent);
            border-radius: 20px;
            padding: 1px 6px;
        }
        .track {
            height: 8px;
            border-radius: 4px;
            background: var(--surface-2);
            overflow: hidden;
        }
        .row:hover .track,
        .row.exp .track {
            background: color-mix(in srgb, var(--ink) 8%, transparent);
        }
        .track i {
            display: block;
            height: 100%;
            border-radius: 4px;
        }
        .track.lolli {
            height: 4px;
            background: var(--track, var(--surface-2));
            overflow: visible;
        }
        .track.lolli i {
            height: 4px;
            position: relative;
            box-shadow: 0 0 8px 0 currentColor;
        }
        .track.lolli i::after {
            content: '';
            position: absolute;
            right: -4px;
            top: 50%;
            transform: translateY(-50%);
            width: 11px;
            height: 11px;
            border-radius: 50%;
            background: inherit;
            box-shadow: 0 0 0 2px var(--app, var(--surface));
        }
        .rv {
            text-align: right;
            font: 700 12.5px var(--mono);
            color: var(--ink);
            font-variant-numeric: tabular-nums;
        }
        .rv em {
            color: var(--muted);
            font-style: normal;
            font-weight: 500;
        }
        .chev {
            color: var(--muted);
            font-size: 11px;
            text-align: center;
        }
        .breakdown {
            padding: 8px 12px 14px 20px;
            display: flex;
            align-items: center;
            gap: 24px;
        }
        .donut-wrap {
            flex: none;
        }
        .donut {
            width: 118px;
            height: 118px;
            border-radius: 50%;
            display: grid;
            place-items: center;
            box-shadow: inset 0 0 0 1px var(--line);
        }
        .dhole {
            width: 74px;
            height: 74px;
            border-radius: 50%;
            background: var(--surface);
            display: grid;
            place-items: center;
            text-align: center;
            line-height: 1.1;
        }
        .dhole b {
            font: 800 20px var(--font-d, var(--font));
            color: var(--ink);
        }
        .dhole small {
            display: block;
            font-size: 9px;
            color: var(--muted);
            letter-spacing: 0.05em;
        }
        .bd-list {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .bd {
            display: grid;
            grid-template-columns: 14px 180px 1fr 120px;
            align-items: center;
            gap: 12px;
        }
        .sw {
            width: 11px;
            height: 11px;
            border-radius: 3px;
        }
        .bd-n {
            font: 600 12px var(--font);
            color: var(--ink-2, var(--ink));
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .bd-track {
            height: 6px;
            border-radius: 3px;
            background: var(--surface);
            overflow: hidden;
        }
        .bd-track i {
            display: block;
            height: 100%;
            background: var(--grad, var(--acc));
            border-radius: 3px;
        }
        .bd-v {
            text-align: right;
            font: 600 11.5px var(--mono);
            color: var(--muted);
            font-variant-numeric: tabular-nums;
        }
        .bd-v em {
            font-style: normal;
            margin-left: 8px;
            opacity: 0.7;
        }
        .more {
            text-align: center;
            font-size: 11.5px;
            color: var(--muted);
            margin: 8px 0 4px;
        }
        .empty {
            padding: 40px;
            text-align: center;
            color: var(--muted);
        }
        @media (max-width: 720px) {
            .row {
                grid-template-columns: 130px 1fr 90px 16px;
            }
            .bd {
                grid-template-columns: 110px 1fr 80px;
            }
        }
    `,
})
export class OwnershipComponent {
    private readonly analytics = inject(AnalyticsStore);
    private readonly filters = inject(FiltersStore);
    private readonly factsStore = inject(FactsStore);

    protected readonly query = signal<string>('');
    protected readonly expanded = signal<string | undefined>(undefined);
    protected readonly personMode = computed<boolean>(() => {
        return this.filters.personId() !== ALL;
    });
    protected readonly name = computed<string>(() => {
        return this.analytics.personName(this.filters.personId());
    });

    private readonly kindMap = computed<Map<string, boolean>>(() => {
        const facts = this.factsStore.facts();
        const map = new Map<string, boolean>();
        if (facts) {
            facts.apps.forEach((a, i) => {
                map.set(a, facts.appKind[i] === 'lib');
            });
        }
        return map;
    });

    private readonly rows = computed<OwnRow[]>(() => {
        const own = this.analytics.ownership();
        const facts = this.factsStore.facts();
        if (!facts) {
            return [];
        }
        const pid = this.filters.personId();
        const person = pid === ALL ? -1 : (pid as number);
        const q = this.query().trim().toLowerCase();
        const kinds = this.kindMap();
        const rows: OwnRow[] = [];

        for (const [nameKey, entry] of Object.entries(own)) {
            if (q && !nameKey.toLowerCase().includes(q)) {
                continue;
            }
            const contribs = this.contribsOf(entry, facts.persons);
            if (person >= 0) {
                const mine = entry.by[person] || 0;
                if (!mine) {
                    continue;
                }
                const share = percent(mine, entry.total);
                rows.push({
                    name: nameKey,
                    lib: kinds.get(nameKey) ?? false,
                    total: mine,
                    percent: share,
                    color: share >= 50 ? 'var(--acc)' : 'var(--s8, var(--warn))',
                    right: `${share.toFixed(0)}% · ${formatCompact(mine)}`,
                    fragile: false,
                    contribs,
                });
            } else {
                const top = contribs[0];
                const share = top?.share ?? 0;
                rows.push({
                    name: nameKey,
                    lib: kinds.get(nameKey) ?? false,
                    total: entry.total,
                    percent: share,
                    color: share >= 70 ? 'var(--bad, #ef4444)' : share >= 50 ? 'var(--warn, #f59e0b)' : 'var(--good, #34d399)',
                    right: `${share.toFixed(0)}% · ${top ? top.name.split(' ')[0] : '—'}`,
                    fragile: share >= 70,
                    contribs,
                });
            }
        }
        rows.sort((a, b) => {
            return b.total - a.total;
        });
        return rows;
    });

    protected readonly viewKey = this.filters.viewKey;
    protected readonly cap = 15;
    protected readonly Kind = ChartKind;
    protected readonly kinds: ChartKind[] = [ChartKind.Bar, ChartKind.Dots];
    protected readonly barKind = signal<ChartKind>(ChartKind.Bar);
    protected readonly appsExp = signal<boolean>(false);
    protected readonly libsExp = signal<boolean>(false);

    private readonly allApps = computed<OwnRow[]>(() => {
        return this.rows().filter((r) => {
            return !r.lib;
        });
    });
    private readonly allLibs = computed<OwnRow[]>(() => {
        return this.rows().filter((r) => {
            return r.lib;
        });
    });
    protected readonly apps = computed<OwnRow[]>(() => {
        return this.appsExp() ? this.allApps() : this.allApps().slice(0, this.cap);
    });
    protected readonly libs = computed<OwnRow[]>(() => {
        return this.libsExp() ? this.allLibs() : this.allLibs().slice(0, this.cap);
    });
    protected readonly appsTotal = computed<number>(() => {
        return this.allApps().length;
    });
    protected readonly libsTotal = computed<number>(() => {
        return this.allLibs().length;
    });

    protected setKind(k: ChartKind) {
        this.barKind.set(k);
    }

    protected toggleApps() {
        this.appsExp.update((v) => {
            return !v;
        });
    }

    protected toggleLibs() {
        this.libsExp.update((v) => {
            return !v;
        });
    }

    protected toggle(name: string) {
        this.expanded.set(this.expanded() === name ? undefined : name);
    }

    protected format(lines: number): string {
        return formatCompact(lines);
    }

    protected cColor(i: number): string {
        return `var(--s${(i % 8) + 1})`;
    }

    protected donutStops(contribs: OwnContrib[]): string {
        let acc = 0;
        const stops: string[] = [];
        contribs.slice(0, 8).forEach((c, i) => {
            const start = acc;
            acc += c.share;
            stops.push(`${this.cColor(i)} ${start.toFixed(2)}% ${acc.toFixed(2)}%`);
        });
        if (acc < 99.9) {
            stops.push(`var(--track, var(--surface-2)) ${acc.toFixed(2)}% 100%`);
        }
        return `conic-gradient(${stops.join(', ')})`;
    }

    private contribsOf(entry: { total: number; by: Record<number, number> }, persons: { name: string }[]): OwnContrib[] {
        return Object.entries(entry.by)
            .map(([id, lines]) => {
                const pid = Number(id);
                return { id: pid, name: persons[pid]?.name || '?', lines, share: percent(lines, entry.total) };
            })
            .sort((a, b) => {
                return b.lines - a.lines;
            });
    }
}
