import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AnalyticsStore, FiltersStore, ThemeStore, format, formatCompact } from '../core';
import { ChartToggleComponent } from './chart.toggle.component';
import { SERIES_DIMS, resolveDim } from './constants';
import { ShareDonutComponent } from './share.donut.component';
import { ChartKind, DonutItem, MomentumRow, RankBucketDim, RankMetric } from './types';
import { mapRankKind } from './utils';

@Component({
    selector: 'cp-momentum',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ChartToggleComponent, ShareDonutComponent],
    template: `
        <div class="head">
            <div>
                <p class="eyebrow">Momentum</p>
                <h2>{{ name() }} — Year over Year</h2>
            </div>
            <cp-chart-toggle [kinds]="rankKinds" [value]="kind()" (picked)="setKind($event)" />
        </div>
        @if (rows().length < 2) {
            <p class="empty card">Not enough years to compare.</p>
        } @else if (kind() === Kind.Donut) {
            <div class="card block">
                <cp-share-donut [items]="donutItems()" unit="years" />
            </div>
        } @else {
            <div class="card block">
                @for (pass of [renderKey()]; track pass) {
                    @for (r of rows(); track r.year) {
                        <div class="row" [title]="r.year + ' — ' + r.value + ' ' + rankDim().label + ' · ' + r.sub">
                            <span class="yr mono">{{ r.year }}</span>
                            <div class="track" [class.lolli]="kind() === Kind.Dots"><i [style.width.%]="r.percent"></i></div>
                            <span class="rv"
                                >{{ r.value }}<em>{{ r.sub }}</em></span
                            >
                            @if (r.delta) {
                                <span class="pill" [class]="r.delta.cls">{{ r.delta.text }}</span>
                            } @else {
                                <span class="pill flat">—</span>
                            }
                        </div>
                    }
                }
            </div>
        }
    `,
    styles: `
        :host {
            display: block;
        }
        .head {
            margin-bottom: 16px;
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
            flex-wrap: wrap;
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
            max-width: 74ch;
        }
        .card {
            background: var(--glass, var(--surface));
            border: 1px solid var(--glass-brd, var(--line));
            border-radius: var(--radius, 14px);
        }
        .block {
            padding: 10px 14px;
        }
        .row {
            display: grid;
            grid-template-columns: 64px 1fr 118px 72px;
            align-items: center;
            gap: 14px;
            padding: 9px 6px;
        }
        .row + .row {
            border-top: 1px solid var(--line-2, var(--line));
        }
        .yr {
            font: 800 14px var(--mono);
            color: var(--ink);
        }
        .track {
            height: 10px;
            border-radius: 6px;
            background: var(--track, var(--surface-2));
        }
        .track i {
            display: block;
            position: relative;
            height: 100%;
            min-width: 2px;
            border-radius: 6px;
            background: var(--grad, var(--acc));
            transform-origin: left center;
        }
        @media (prefers-reduced-motion: no-preference) {
            .track i {
                animation: bar-grow-x 0.5s cubic-bezier(0.2, 0.7, 0.2, 1) backwards;
            }
            @keyframes bar-grow-x {
                from {
                    transform: scaleX(0);
                }
            }
        }
        .track.lolli {
            height: 3px;
        }
        .track.lolli i {
            background: transparent;
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
            background: var(--acc-ink, var(--acc));
            box-shadow: 0 0 10px var(--acc-soft);
        }
        .rv {
            text-align: right;
            font: 800 13px var(--mono);
            color: var(--ink);
            font-variant-numeric: tabular-nums;
        }
        .rv em {
            display: block;
            font: 600 10.5px var(--font);
            font-style: normal;
            color: var(--muted);
        }
        .pill {
            justify-self: end;
            font: 700 10.5px var(--mono);
            font-variant-numeric: tabular-nums;
            border-radius: 999px;
            padding: 2px 8px;
            white-space: nowrap;
        }
        .pill.up {
            color: var(--good);
            background: color-mix(in srgb, var(--good) 15%, transparent);
        }
        .pill.dn {
            color: var(--bad);
            background: color-mix(in srgb, var(--bad) 15%, transparent);
        }
        .pill.flat {
            color: var(--muted);
            background: var(--surface-2, transparent);
        }
        .empty {
            padding: 24px;
            text-align: center;
            color: var(--muted);
        }
    `,
})
export class MomentumComponent {
    private readonly analytics = inject(AnalyticsStore);
    private readonly filters = inject(FiltersStore);
    private readonly theme = inject(ThemeStore);

    protected readonly Kind = ChartKind;
    protected readonly rankKinds: ChartKind[] = [ChartKind.Bar, ChartKind.Dots, ChartKind.Donut];
    private readonly userKind = signal<ChartKind | undefined>(undefined);
    protected readonly kind = computed<ChartKind>(() => {
        return this.userKind() ?? mapRankKind(this.theme.charts().ranking);
    });

    protected setKind(kind: ChartKind) {
        this.userKind.set(kind);
    }

    protected readonly rankDim = computed<RankBucketDim>(() => {
        return resolveDim(this.filters.sortKey(), SERIES_DIMS);
    });

    protected readonly name = computed<string>(() => {
        return this.analytics.personName(this.filters.personId());
    });

    protected readonly renderKey = computed<string>(() => {
        return `${this.filters.viewKey()}:${this.kind()}`;
    });

    protected readonly donutItems = computed<DonutItem[]>(() => {
        const cell = this.analytics.selectedCell();
        if (!cell) {
            return [];
        }
        const dim = this.rankDim();
        return Object.keys(cell.year)
            .sort()
            .map((year, index) => {
                const value = dim.value(cell.year[year]);
                return { label: year, value, color: `var(--s${(index % 8) + 1})`, display: dim.format(value) };
            });
    });

    protected readonly rows = computed<MomentumRow[]>(() => {
        const cell = this.analytics.selectedCell();
        if (!cell) {
            return [];
        }
        const dim = this.rankDim();
        const years = Object.keys(cell.year).sort();
        const max = Math.max(
            1,
            ...years.map((y) => {
                return dim.value(cell.year[y]);
            }),
        );
        return years.map((year, i) => {
            const value = dim.value(cell.year[year]);
            const prev = i > 0 ? dim.value(cell.year[years[i - 1]]) : 0;
            const sub = dim.metric === RankMetric.Commits ? `${formatCompact(cell.year[year][1])} lines` : `${format(cell.year[year][0])} commits`;
            return { year, value: dim.format(value), sub, percent: (value / max) * 100, delta: this.deltaOf(value, prev) };
        });
    });

    private deltaOf(current: number, previous: number): MomentumRow['delta'] {
        if (!previous) {
            return;
        }
        const change = Math.round(((current - previous) / previous) * 100);
        if (change > 0) {
            return { text: `▲ ${change}%`, cls: 'up' };
        }
        if (change < 0) {
            return { text: `▼ ${Math.abs(change)}%`, cls: 'dn' };
        }
        return { text: '0%', cls: 'flat' };
    }
}
