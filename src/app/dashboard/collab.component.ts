import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FactsStore, FiltersStore, MR, MrState, ThemeStore, percent } from '../core';
import { ChartToggleComponent } from './chart.toggle.component';
import { ChartKind, Integrator, Rel } from './types';
import { mapRankKind } from './utils';

@Component({
    selector: 'cp-collab',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ChartToggleComponent],
    template: `
        <div class="head">
            <div>
                <p class="eyebrow">Collaboration</p>
                <h2>Who Reviews &amp; Merges</h2>
            </div>
            <cp-chart-toggle [kinds]="rankKinds" [value]="kind()" (picked)="setKind($event)" />
        </div>

        @if (!hasData()) {
            <p class="empty card">No merged merge requests in this view.</p>
        } @else {
            <div class="stat card">
                <span class="stat-v">{{ selfRate() }}%</span>
                <span class="stat-l">of merges are self-merges</span>
            </div>

            <div class="grid">
                <div class="card">
                    <p class="bh">Top merge relationships</p>
                    @for (pass of [renderKey()]; track pass) {
                        @for (r of relationships(); track r.label) {
                            <div class="row" [title]="r.label + ' — ' + r.count + ' merges'">
                                <span class="rn">{{ r.label }}</span>
                                <div class="bar" [class.lolli]="kind() === Kind.Dots"><i [style.width.%]="r.width"></i></div>
                                <span class="rv">{{ r.count }}</span>
                            </div>
                        }
                    }
                </div>

                <div class="card">
                    <p class="bh">Who integrates the most</p>
                    @for (pass of [renderKey()]; track pass) {
                        @for (i of integrators(); track i.name) {
                            <div class="row" [title]="i.name + ' — integrated ' + i.count + ' MRs for others'">
                                <span class="rn">{{ i.name }}</span>
                                <div class="bar" [class.lolli]="kind() === Kind.Dots"><i [style.width.%]="i.width"></i></div>
                                <span class="rv">{{ i.count }}</span>
                            </div>
                        }
                    }
                </div>
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
        }
        .card {
            background: var(--glass, var(--surface));
            border: 1px solid var(--glass-brd, var(--line));
            border-radius: var(--radius, 14px);
            padding: 16px 18px;
        }
        .stat {
            display: flex;
            align-items: baseline;
            gap: 12px;
            margin-bottom: 16px;
        }
        .stat-v {
            font: 800 28px var(--font-d);
            color: var(--acc);
            font-variant-numeric: tabular-nums;
        }
        .stat-l {
            font-size: 12.5px;
            color: var(--muted);
        }
        .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }
        .bh {
            font: 700 11px var(--font);
            letter-spacing: 0.04em;
            color: var(--muted);
            margin: 0 0 14px;
        }
        .row {
            display: grid;
            grid-template-columns: 1fr 120px 48px;
            align-items: center;
            gap: 12px;
            padding: 6px 0;
        }
        .rn {
            font: 600 12.5px var(--font);
            color: var(--ink);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .bar {
            height: 8px;
            border-radius: 4px;
            background: var(--track, var(--surface-2));
        }
        .bar i {
            display: block;
            position: relative;
            height: 100%;
            min-width: 2px;
            border-radius: 4px;
            background: var(--grad, var(--acc));
            transform-origin: left center;
        }
        .bar.lolli {
            height: 3px;
        }
        .bar.lolli i {
            background: transparent;
        }
        .bar.lolli i::after {
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
            .bar i {
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
            font: 700 12.5px var(--mono);
            color: var(--ink);
            font-variant-numeric: tabular-nums;
        }
        .empty {
            padding: 40px;
            text-align: center;
            color: var(--muted);
        }
        @media (max-width: 760px) {
            .grid {
                grid-template-columns: 1fr;
            }
            .row {
                grid-template-columns: 1fr 80px 40px;
            }
        }
    `,
})
export class CollabComponent {
    private readonly factsStore = inject(FactsStore);
    private readonly filters = inject(FiltersStore);
    private readonly theme = inject(ThemeStore);

    protected readonly Kind = ChartKind;
    protected readonly rankKinds: ChartKind[] = [ChartKind.Bar, ChartKind.Dots];
    private readonly userKind = signal<ChartKind | undefined>(undefined);
    protected readonly kind = computed<ChartKind>(() => {
        return this.userKind() ?? mapRankKind(this.theme.charts().ranking);
    });

    protected setKind(kind: ChartKind) {
        this.userKind.set(kind);
    }

    protected readonly renderKey = computed<string>(() => {
        return `${this.filters.viewKey()}:${this.kind()}`;
    });

    private readonly merged = computed<{ author: number; merger: number }[]>(() => {
        const facts = this.factsStore.facts();
        if (!facts) {
            return [];
        }
        const out: { author: number; merger: number }[] = [];
        for (const m of facts.MR) {
            if (m[MR.State] !== MrState.Merged) {
                continue;
            }
            if (!this.filters.okRepo(m[MR.Repo] as number) || !this.filters.inScope(m[MR.Created] as string)) {
                continue;
            }
            out.push({ author: m[MR.Author] as number, merger: m[MR.Merger] as number });
        }
        return out;
    });

    protected readonly hasData = computed<boolean>(() => {
        return this.merged().length > 0;
    });

    protected readonly selfRate = computed<string>(() => {
        const rows = this.merged();
        const withMerger = rows.filter((r) => {
            return r.merger >= 0;
        });
        if (!withMerger.length) {
            return '0';
        }
        const self = withMerger.filter((r) => {
            return r.merger === r.author;
        }).length;
        return percent(self, withMerger.length).toFixed(0);
    });

    protected readonly relationships = computed<Rel[]>(() => {
        const facts = this.factsStore.facts();
        if (!facts) {
            return [];
        }
        const counts = new Map<string, number>();
        for (const r of this.merged()) {
            if (r.merger < 0 || r.merger === r.author) {
                continue;
            }
            const key = `${r.merger}:${r.author}`;
            counts.set(key, (counts.get(key) || 0) + 1);
        }
        const sorted = [...counts.entries()]
            .sort((a, b) => {
                return b[1] - a[1];
            })
            .slice(0, 12);
        const max = Math.max(
            1,
            ...sorted.map(([, count]) => {
                return count;
            }),
        );
        return sorted.map(([key, count]) => {
            const [mergerIndex, authorIndex] = key.split(':').map(Number);
            return { label: `${this.name(facts.persons, mergerIndex)} → ${this.name(facts.persons, authorIndex)}`, count, width: (count / max) * 100 };
        });
    });

    protected readonly integrators = computed<Integrator[]>(() => {
        const facts = this.factsStore.facts();
        if (!facts) {
            return [];
        }
        const counts = new Map<number, number>();
        for (const r of this.merged()) {
            if (r.merger < 0) {
                continue;
            }
            counts.set(r.merger, (counts.get(r.merger) || 0) + 1);
        }
        const sorted = [...counts.entries()]
            .sort((a, b) => {
                return b[1] - a[1];
            })
            .slice(0, 8);
        const max = Math.max(
            1,
            ...sorted.map(([, count]) => {
                return count;
            }),
        );
        return sorted.map(([personIndex, count]) => {
            return { name: this.name(facts.persons, personIndex), count, width: (count / max) * 100 };
        });
    });

    private name(persons: { name: string }[], idx: number): string {
        return persons[idx]?.name || '?';
    }
}
