import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AnalyticsStore, FactsStore, FiltersStore, ThemeStore, format, formatCompact } from '../core';
import { ChartToggleComponent, mapRankKind } from './chart.toggle.component';
import { SERIES_DIMS, resolveDim } from './constants';
import { ShareDonutComponent } from './share.donut.component';
import { ChartKind, DonutItem, RankBucketDim, RankMetric, RepoRow } from './types';

@Component({
    selector: 'cp-repos',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ChartToggleComponent, ShareDonutComponent],
    template: `
        <div class="head">
            <div>
                <p class="eyebrow">Where it landed</p>
                <h2>{{ name() }} — by repository</h2>
                <p class="sub">Each repository's {{ rankDim().label }} in this view, ranked by volume. Front-end and back-end are coloured apart.</p>
            </div>
            <cp-chart-toggle [kinds]="rankKinds" [value]="kind()" (picked)="setKind($event)" />
        </div>
        @if (!rows().length) {
            <p class="empty card">No repository activity in this view.</p>
        } @else if (kind() === Kind.Donut) {
            <div class="card block">
                <cp-share-donut [items]="donutItems()" unit="repositories" />
            </div>
        } @else {
            <div class="card block">
                @for (pass of [renderKey()]; track pass) {
                    @for (r of rows(); track r.name) {
                        <div class="row" [title]="r.name + ' — ' + r.value + ' ' + rankDim().label + ' · ' + r.sub">
                            <span class="rn mono">{{ r.name }}</span>
                            <div class="track" [class.lolli]="kind() === Kind.Dots" [style.--bar]="color(r.group)"><i [style.width.%]="r.percent"></i></div>
                            <span class="rv"
                                >{{ r.value }}<em>{{ r.sub }}</em></span
                            >
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
            grid-template-columns: minmax(140px, 220px) 1fr 128px;
            align-items: center;
            gap: 14px;
            padding: 8px 6px;
        }
        .row + .row {
            border-top: 1px solid var(--line-2, var(--line));
        }
        .rn {
            font: 600 12.5px var(--mono);
            color: var(--ink);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .track {
            height: 8px;
            border-radius: 6px;
            background: var(--track, var(--surface-2));
        }
        .track i {
            display: block;
            position: relative;
            height: 100%;
            min-width: 2px;
            border-radius: 6px;
            background: var(--bar, var(--acc));
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
            background: var(--bar, var(--acc));
            box-shadow: 0 0 10px color-mix(in srgb, var(--bar, var(--acc)) 60%, transparent);
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
        .empty {
            padding: 24px;
            text-align: center;
            color: var(--muted);
        }
    `,
})
export class ReposComponent {
    private readonly analytics = inject(AnalyticsStore);
    private readonly facts = inject(FactsStore);
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

    protected readonly donutItems = computed<DonutItem[]>(() => {
        return this.rows()
            .slice(0, 8)
            .map((row) => {
                return { label: row.name, value: row.metric, color: this.color(row.group), display: row.value };
            });
    });

    protected readonly name = computed<string>(() => {
        return this.analytics.personName(this.filters.personId());
    });

    protected readonly renderKey = computed<string>(() => {
        return `${this.filters.viewKey()}:${this.kind()}`;
    });

    protected readonly rows = computed<RepoRow[]>(() => {
        const cell = this.analytics.selectedCell();
        if (!cell) {
            return [];
        }
        const groups = this.facts.facts()?.repoGroups ?? {};
        const dim = this.rankDim();
        const entries = Object.entries(cell.byrepo);
        const max = Math.max(
            1,
            ...entries.map(([, v]) => {
                return dim.value(v);
            }),
        );
        return entries
            .map(([repo, v]) => {
                const metric = dim.value(v);
                const sub = dim.metric === RankMetric.Commits ? `${formatCompact(v[1])} lines` : `${format(v[0])} commits`;
                return { name: repo, group: groups[repo] ?? 'Other', metric, value: dim.format(metric), sub, percent: (metric / max) * 100 };
            })
            .sort((a, b) => {
                return b.metric - a.metric;
            });
    });

    protected color(group: string): string {
        if (group === 'Front-end') {
            return 'var(--s5)';
        }
        if (group === 'Back-end') {
            return 'var(--s2)';
        }
        return 'var(--s3)';
    }
}
