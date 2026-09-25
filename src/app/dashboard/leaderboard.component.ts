import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ALL, AnalyticsStore, FiltersStore, PersonId, RankRow, sortByKey, ThemeStore } from '../core';
import { ChartToggleComponent } from './chart.toggle.component';
import { LEADERBOARD_CAP } from './constants';
import { ChartKind } from './types';
import { mapRankKind } from './utils';

@Component({
    selector: 'cp-leaderboard',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ChartToggleComponent],
    template: `
        <div class="lb-head">
            <div>
                <p class="eyebrow">The Team</p>
                <h2>Ranked by {{ sortLabel() }}</h2>
            </div>
            <cp-chart-toggle [kinds]="rankKinds" [value]="kind()" (picked)="setKind($event)" />
        </div>
        <div class="lb card" [class.list]="listMode()">
            @for (pass of [renderKey()]; track pass) {
                @for (row of visible(); track row.id; let i = $index) {
                    <button class="lb-row" [class.sel]="row.id === selected()" (click)="select(row.id)" [title]="'#' + (i + 1) + '  ' + row.name + ' — ' + def().format(row.value) + ' ' + sortLabel()">
                        @if (i < 3) {
                            <span class="medal" [class]="'m' + (i + 1)">{{ i + 1 }}</span>
                        } @else {
                            <span class="rk">{{ i + 1 }}</span>
                        }
                        <span class="nm">{{ row.name }}</span>
                        <span class="track" [class.lolli]="kind() === Kind.Dots"><i class="fill" [style.width.%]="widthOf(row.value)"></i></span>
                        <span class="val">{{ def().format(row.value) }}</span>
                    </button>
                }
            }
            @if (!rows().length) {
                <p class="empty">No contributors in this view.</p>
            }
            @if (hidden() > 0) {
                <button type="button" class="more" (click)="toggle()">{{ expanded() ? 'Show Top ' + cap : 'Show All ' + rows().length + ' Contributors' }}</button>
            }
        </div>
    `,
    styles: `
        :host {
            display: block;
        }
        .lb-head {
            margin-bottom: 12px;
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
        }
        .eyebrow {
            font: 700 10px var(--font);
            letter-spacing: 0.08em;
            color: var(--muted);
            margin: 0 0 3px;
        }
        .lb-head h2 {
            font: 700 19px var(--font-d);
            margin: 0;
            color: var(--ink);
        }
        .sub {
            font-size: 12.5px;
            color: var(--muted);
            margin: 3px 0 0;
            max-width: 74ch;
        }
        .card {
            background: var(--glass, var(--surface));
            border: 1px solid var(--glass-brd, var(--line));
            border-radius: var(--radius, 14px);
            padding: 10px;
        }
        .lb-row {
            width: 100%;
            display: grid;
            grid-template-columns: 30px minmax(120px, 190px) 1fr 96px;
            align-items: center;
            gap: 14px;
            padding: 7px 10px;
            border: 1px solid transparent;
            background: none;
            border-radius: 11px;
            cursor: pointer;
            color: var(--ink);
            text-align: left;
            transition:
                background 0.1s,
                transform 0.1s;
        }
        .lb-row:hover {
            background: var(--surface-2);
            transform: translateX(2px);
        }
        .lb-row.sel {
            background: var(--acc-soft);
            border-color: var(--acc-line, var(--acc));
        }
        .rk {
            font: 700 12.5px var(--font);
            color: var(--muted);
            text-align: center;
            font-variant-numeric: tabular-nums;
        }
        .medal {
            display: inline-grid;
            place-items: center;
            width: 22px;
            height: 22px;
            border-radius: 7px;
            font: 800 11px var(--font);
            color: #fff;
            justify-self: center;
        }
        .m1 {
            background: linear-gradient(145deg, #f5b942, #e59505);
        }
        .m2 {
            background: linear-gradient(145deg, #aab6c6, #8896aa);
        }
        .m3 {
            background: linear-gradient(145deg, #e08a54, #c06a32);
        }
        .nm {
            font: 600 13px var(--font);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .lb-row.sel .nm {
            font-weight: 800;
            color: var(--acc-ink, var(--acc));
        }
        .track {
            height: 6px;
            border-radius: 6px;
            background: var(--track, var(--surface-2));
            overflow: visible;
        }
        .track.lolli {
            height: 3px;
        }
        .lb.list .lb-row {
            grid-template-columns: 30px 1fr 96px;
        }
        .lb.list .track {
            display: none;
        }
        .fill {
            display: block;
            height: 100%;
            min-width: 2px;
            border-radius: 6px;
            background: var(--grad, var(--acc));
            position: relative;
            box-shadow: 0 0 12px var(--acc-soft);
            transform-origin: left center;
        }
        @media (prefers-reduced-motion: no-preference) {
            .fill {
                animation: lb-grow 0.55s cubic-bezier(0.2, 0.7, 0.2, 1) backwards;
            }
            @keyframes lb-grow {
                from {
                    transform: scaleX(0);
                }
            }
        }
        .track.lolli .fill {
            background: transparent;
            box-shadow: none;
        }
        .fill::after {
            content: '';
            position: absolute;
            right: -4px;
            top: 50%;
            transform: translateY(-50%);
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: var(--acc-ink, var(--acc));
            box-shadow:
                0 0 12px var(--acc),
                0 0 0 3px var(--app, var(--surface));
        }
        .val {
            text-align: right;
            font: 800 13px var(--mono);
            color: var(--ink);
            font-variant-numeric: tabular-nums;
        }
        .empty {
            padding: 18px;
            text-align: center;
            color: var(--muted);
        }
        .more {
            width: 100%;
            margin-top: 6px;
            padding: 10px;
            border: 1px solid var(--line);
            background: var(--surface-2);
            color: var(--acc-ink, var(--acc));
            border-radius: 10px;
            font: 700 12.5px var(--font);
            cursor: pointer;
            transition: 0.13s;
        }
        .more:hover {
            border-color: var(--acc);
            background: var(--acc-soft);
        }
        @media (max-width: 560px) {
            .lb-row {
                grid-template-columns: 26px 96px 1fr 78px;
                gap: 8px;
            }
        }
    `,
})
export class LeaderboardComponent {
    private readonly analytics = inject(AnalyticsStore);
    private readonly filters = inject(FiltersStore);
    private readonly theme = inject(ThemeStore);

    protected readonly Kind = ChartKind;
    protected readonly cap = LEADERBOARD_CAP;
    protected readonly rankKinds: ChartKind[] = [ChartKind.Bar, ChartKind.Dots];
    private readonly userKind = signal<ChartKind | undefined>(undefined);
    protected readonly kind = computed<ChartKind>(() => {
        return this.userKind() ?? mapRankKind(this.theme.charts().ranking);
    });
    protected readonly listMode = computed<boolean>(() => {
        return this.userKind() === undefined && this.theme.charts().ranking === 'list';
    });

    protected readonly rows = this.analytics.ranked;
    protected readonly expanded = signal<boolean>(false);
    protected readonly visible = computed<RankRow[]>(() => {
        return this.expanded() ? this.rows() : this.rows().slice(0, LEADERBOARD_CAP);
    });
    // Re-key the rows so the bar-grow animation replays on data / metric / style changes.
    protected readonly renderKey = computed<string>(() => {
        return `${this.filters.viewKey()}:${this.kind()}:${this.listMode()}:${this.expanded()}`;
    });
    protected readonly hidden = computed<number>(() => {
        return Math.max(0, this.rows().length - LEADERBOARD_CAP);
    });
    protected readonly selected = this.filters.personId;
    protected readonly def = computed(() => {
        return sortByKey(this.filters.sortKey());
    });
    protected readonly sortLabel = computed<string>(() => {
        return this.def().label;
    });
    private readonly max = computed<number>(() => {
        return Math.max(
            1,
            ...this.rows().map((r) => {
                return Math.max(0, r.value);
            }),
        );
    });

    protected setKind(kind: ChartKind) {
        this.userKind.set(kind);
    }

    protected toggle() {
        this.expanded.update((v) => {
            return !v;
        });
    }

    protected widthOf(value: number): number {
        return Math.max(0, (value / this.max()) * 100);
    }

    protected select(id: PersonId) {
        this.filters.personId.set(this.selected() === id ? ALL : id);
    }
}
