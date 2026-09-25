import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AnalyticsStore, FiltersStore, ThemeStore, format, formatCompact, percent } from '../core';
import { ChartToggleComponent, mapRankKind } from './chart.toggle.component';
import { TYPE_DIMS, resolveDim } from './constants';
import { ShareDonutComponent } from './share.donut.component';
import { ChartKind, DonutItem, RankBucketDim, RankMetric, ScopeRow, Tier, TypeRow } from './types';

@Component({
    selector: 'cp-work',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ChartToggleComponent, ShareDonutComponent],
    template: `
        @if (!cell(); as _n) {
            <p class="empty card">No work in this view.</p>
        } @else {
            <div class="head">
                <div>
                    <p class="eyebrow">The shape of the work</p>
                    <h2>{{ name() }} — what kind of commits</h2>
                    <p class="sub">Commit types by {{ rankDim().label }} in this view, ranked by volume.</p>
                </div>
                <cp-chart-toggle [kinds]="rankKinds" [value]="kind()" (picked)="setKind($event)" />
            </div>
            @if (kind() === Kind.Donut) {
                <div class="card block">
                    @if (types().length) {
                        <cp-share-donut [items]="typeDonut()" unit="types" />
                    } @else {
                        <p class="empty">No typed commits in this view.</p>
                    }
                </div>
            } @else {
                <div class="card block">
                    @for (pass of [renderKey()]; track pass) {
                        @for (t of types(); track t.label) {
                            <div class="row" [title]="t.label + ' — ' + t.detail">
                                <span class="rn">{{ t.label }}</span>
                                <div class="track" [class.lolli]="kind() === Kind.Dots"><i [style.width.%]="t.percent"></i></div>
                                <span class="rv">{{ t.detail }}</span>
                            </div>
                        }
                    }
                    @if (!types().length) {
                        <p class="empty">No typed commits in this view.</p>
                    }
                </div>
            }

            <div class="head second">
                <p class="eyebrow">Familiarity</p>
                <h2>Where they're familiar</h2>
                <p class="sub">Service areas they touch most — tiers are a rough read of ownership depth.</p>
            </div>
            <div class="card block">
                @for (pass of [renderKey()]; track pass) {
                    @for (tier of tiers(); track tier.key) {
                        <div class="tier-row">
                            <span class="tier-badge" [class]="tier.badgeClass">{{ tier.badge }}</span>
                            <span class="tier-line"></span>
                        </div>
                        @for (s of tier.rows; track s.name) {
                            <div class="row" [title]="s.name + ' — ' + s.detail + ' (' + tier.badge + ')'">
                                <span class="rn mono">{{ s.name }}</span>
                                <div class="track" [class.lolli]="kind() === Kind.Dots"><i [style.width.%]="s.percent"></i></div>
                                <span class="rv">{{ s.detail }}</span>
                            </div>
                        }
                    }
                }
                @if (!tiers().length) {
                    <p class="empty">No service areas in this view.</p>
                }
            </div>
        }
    `,
    styles: `
        :host {
            display: block;
        }
        .head {
            margin-bottom: 14px;
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
            flex-wrap: wrap;
        }
        .head.second {
            margin-top: 22px;
            display: block;
        }
        .eyebrow {
            font: 700 10px var(--font);
            letter-spacing: 0.08em;
            color: var(--muted);
            margin: 0 0 3px;
        }
        h2 {
            font: 800 22px var(--font-d, var(--font));
            margin: 0;
            color: var(--ink);
        }
        .sub {
            font-size: 12.5px;
            color: var(--muted);
            margin: 4px 0 0;
            max-width: 70ch;
        }
        .card {
            background: var(--glass, var(--surface));
            border: 1px solid var(--glass-brd, var(--line));
            border-radius: var(--radius, 14px);
        }
        .block {
            padding: 14px 18px;
        }
        .row {
            display: grid;
            grid-template-columns: 150px 1fr 150px;
            align-items: center;
            gap: 14px;
            padding: 6px 0;
        }
        .rn {
            font: 600 12.5px var(--font);
            color: var(--ink);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .rn.mono {
            font-family: var(--mono);
            font-size: 12px;
        }
        .track {
            height: 8px;
            border-radius: 4px;
            background: var(--surface-2);
        }
        .track i {
            display: block;
            position: relative;
            height: 100%;
            min-width: 2px;
            border-radius: 4px;
            background: var(--grad, var(--acc));
            transform-origin: left center;
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
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: var(--acc-ink, var(--acc));
            box-shadow: 0 0 10px var(--acc-soft);
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
        .rv {
            text-align: right;
            font: 600 12px var(--mono);
            color: var(--ink-2, var(--muted));
            font-variant-numeric: tabular-nums;
        }
        .tier-row {
            display: flex;
            align-items: center;
            gap: 9px;
            margin: 16px 0 8px;
        }
        .tier-row:first-child {
            margin-top: 2px;
        }
        .tier-badge {
            font: 800 10px var(--font);
            letter-spacing: 0.05em;
            padding: 3px 10px;
            border-radius: 7px;
        }
        .tier-line {
            flex: 1;
            height: 1px;
            background: var(--line);
        }
        .t-expert {
            background: var(--acc-soft);
            color: var(--acc-ink, var(--acc));
        }
        .t-strong {
            background: var(--good-soft, color-mix(in srgb, var(--good) 15%, transparent));
            color: var(--good);
        }
        .t-working {
            background: var(--surface-2);
            color: var(--muted);
        }
        .empty {
            padding: 22px;
            text-align: center;
            color: var(--muted);
        }
        @media (max-width: 620px) {
            .row {
                grid-template-columns: 96px 1fr 96px;
                gap: 8px;
            }
        }
    `,
})
export class WorkComponent {
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

    protected readonly cell = this.analytics.selectedCell;
    protected readonly name = computed<string>(() => {
        return this.analytics.personName(this.filters.personId());
    });

    protected readonly renderKey = computed<string>(() => {
        return `${this.filters.viewKey()}:${this.kind()}`;
    });

    protected readonly rankDim = computed<RankBucketDim>(() => {
        return resolveDim(this.filters.sortKey(), TYPE_DIMS);
    });

    protected readonly typeDonut = computed<DonutItem[]>(() => {
        const dim = this.rankDim();
        return this.types().map((row, index) => {
            return { label: row.label, value: row.metric, color: `var(--s${(index % 8) + 1})`, display: dim.format(row.metric) };
        });
    });

    protected readonly types = computed<TypeRow[]>(() => {
        const c = this.cell();
        if (!c) {
            return [];
        }
        const dim = this.rankDim();
        const entries = Object.entries(c.types).sort((a, b) => {
            return dim.value(b[1]) - dim.value(a[1]);
        });
        const max = Math.max(
            1,
            ...entries.map((e) => {
                return dim.value(e[1]);
            }),
        );
        return entries.map(([label, v]) => {
            const value = dim.value(v);
            const detail = dim.metric === RankMetric.Commits ? `${format(v[0])} · ${formatCompact(v[1] || 0)} ln` : `${dim.format(value)} ${dim.label} · ${format(v[0])} commits`;
            return {
                label,
                metric: value,
                percent: (value / max) * 100,
                detail,
            };
        });
    });

    protected readonly tiers = computed<Tier[]>(() => {
        const c = this.cell();
        if (!c) {
            return [];
        }
        const entries = Object.entries(c.scopes).sort((a, b) => {
            return b[1][1] - a[1][1];
        });
        if (!entries.length) {
            return [];
        }
        const total =
            entries.reduce((s, e) => {
                return s + (e[1][1] || 0);
            }, 0) || 1;
        const max = Math.max(
            1,
            ...entries.map((e) => {
                return e[1][1] || 0;
            }),
        );
        const groups: Record<string, ScopeRow[]> = { expert: [], strong: [], working: [] };
        for (const [name, v] of entries) {
            const lines = v[1] || 0;
            const share = percent(lines, total);
            const key = share >= 25 ? 'expert' : share >= 10 ? 'strong' : 'working';
            groups[key].push({ name, percent: (lines / max) * 100, detail: `${formatCompact(lines)} · ${share.toFixed(0)}%` });
        }
        const meta: { key: string; badge: string; badgeClass: string }[] = [
            { key: 'expert', badge: 'Expert', badgeClass: 't-expert' },
            { key: 'strong', badge: 'Strong', badgeClass: 't-strong' },
            { key: 'working', badge: 'Working', badgeClass: 't-working' },
        ];
        return meta
            .filter((m) => {
                return groups[m.key].length;
            })
            .map((m) => {
                return { ...m, rows: groups[m.key] };
            });
    });
}
