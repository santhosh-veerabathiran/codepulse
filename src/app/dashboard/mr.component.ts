import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AnalyticsStore, FiltersStore, format, formatDuration } from '../core';
import { ReplayDirective } from './replay.directive';
import { MrKpi, Seg, YearRow } from './types';

@Component({
    selector: 'cp-mr',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ReplayDirective],
    template: `
        <div class="head">
            <p class="eyebrow">Merge requests</p>
            <h2>{{ name() }} — merge requests &amp; review</h2>
            <p class="sub">Every MR they authored, by state. Time-to-merge and review comments are medians. "MRs they merged" counts integration done for others.</p>
        </div>

        @if (!cell(); as _n) {
            <p class="empty card">No merge requests in this view.</p>
        } @else {
            <div class="kpis" *cpReplay="viewKey()">
                @for (k of kpis(); track k.label) {
                    <div class="kpi" [class.hot]="k.hot">
                        <span class="k-l">{{ k.label }}</span>
                        <span class="k-v">{{ k.value }}</span>
                        @if (k.note) {
                            <span class="k-s">{{ k.note }}</span>
                        }
                    </div>
                }
            </div>

            @if (states().length) {
                <div class="card block" *cpReplay="viewKey()">
                    <p class="bh">Outcomes</p>
                    <div class="segbar">
                        @for (s of states(); track s.label) {
                            <div class="seg" [style.width.%]="s.w" [style.background]="s.color" [title]="s.label + ': ' + s.value"></div>
                        }
                    </div>
                    <div class="legend">
                        @for (s of states(); track s.label) {
                            <span><i [style.background]="s.color"></i>{{ s.label }} {{ s.value }}</span>
                        }
                    </div>
                </div>
            }

            @if (years().length) {
                <div class="card block" *cpReplay="viewKey()">
                    <p class="bh">MRs opened by year — merged · closed · open</p>
                    <div class="years">
                        @for (y of years(); track y.year) {
                            <div class="yr">
                                <span class="yl">{{ y.year }}</span>
                                <div class="segbar">
                                    @for (s of y.segs; track s.label) {
                                        <div class="seg" [style.width.%]="s.w" [style.background]="s.color" [title]="y.year + ' ' + s.label + ': ' + s.value"></div>
                                    }
                                </div>
                                <span class="ys">{{ y.summary }}</span>
                            </div>
                        }
                    </div>
                    <div class="legend">
                        <span><i style="background: var(--s2)"></i>Merged</span>
                        <span><i style="background: var(--s6, var(--bad))"></i>Closed</span>
                        <span><i style="background: var(--s3)"></i>Open</span>
                    </div>
                </div>
            }

            @if (openCount()) {
                <p class="opennote">{{ openCount() }} open MR{{ openCount() === 1 ? '' : 's' }} awaiting merge — titles aren't captured in the snapshot, so only the count is shown here.</p>
            }
        }
    `,
    styles: `
        :host {
            display: block;
        }
        .head {
            margin-bottom: 16px;
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
            max-width: 78ch;
        }
        .card {
            background: var(--glass, var(--surface));
            border: 1px solid var(--glass-brd, var(--line));
            border-radius: var(--radius, 14px);
        }
        .kpis {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 12px;
            margin-bottom: 16px;
        }
        .kpi {
            background: var(--glass, var(--surface));
            border: 1px solid var(--glass-brd, var(--line));
            border-left: 3px solid var(--s2);
            border-radius: var(--radius, 14px);
            padding: 13px 15px;
            display: flex;
            flex-direction: column;
            gap: 3px;
        }
        .kpi.hot {
            border-left-color: var(--acc);
            box-shadow: 0 0 0 1px var(--acc) inset;
        }
        .k-l {
            font: 700 10.5px var(--font);
            letter-spacing: 0.04em;
            color: var(--muted);
        }
        .k-v {
            font: 800 24px/1 var(--font-d);
            color: var(--ink);
            font-variant-numeric: tabular-nums;
        }
        .k-s {
            font-size: 11.5px;
            color: var(--muted);
        }
        .block {
            padding: 16px 18px;
            margin-bottom: 16px;
        }
        .bh {
            font: 700 11px var(--font);
            letter-spacing: 0.04em;
            color: var(--muted);
            margin: 0 0 14px;
        }
        .segbar {
            display: flex;
            height: 15px;
            border-radius: 5px;
            overflow: hidden;
            gap: 2px;
            background: var(--surface-2);
        }
        .seg {
            height: 100%;
        }
        .legend {
            display: flex;
            gap: 16px;
            margin-top: 10px;
            font-size: 12px;
            color: var(--ink-2, var(--ink));
            flex-wrap: wrap;
        }
        .legend i {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 3px;
            margin-right: 6px;
            vertical-align: middle;
        }
        .years {
            display: flex;
            flex-direction: column;
            gap: 9px;
        }
        .yr {
            display: grid;
            grid-template-columns: 46px 1fr 230px;
            align-items: center;
            gap: 12px;
            font-size: 12.5px;
        }
        .yl {
            font: 600 12.5px var(--mono);
            color: var(--ink);
        }
        .ys {
            font-variant-numeric: tabular-nums;
            color: var(--muted);
        }
        .opennote {
            font-size: 12.5px;
            color: var(--muted);
        }
        .empty {
            padding: 40px;
            text-align: center;
            color: var(--muted);
        }
        @media (max-width: 720px) {
            .yr {
                grid-template-columns: 40px 1fr;
            }
            .yr .ys {
                grid-column: 2;
            }
        }
    `,
})
export class MrComponent {
    private readonly analytics = inject(AnalyticsStore);
    private readonly filters = inject(FiltersStore);

    protected readonly cell = this.analytics.selectedCell;
    protected readonly viewKey = this.filters.viewKey;
    protected readonly name = computed<string>(() => {
        return this.analytics.personName(this.filters.personId());
    });
    protected readonly openCount = computed<number>(() => {
        return this.cell()?.mergeRequests.open ?? 0;
    });

    protected readonly kpis = computed<MrKpi[]>(() => {
        const c = this.cell();
        if (!c) {
            return [];
        }
        const mr = c.mergeRequests;
        return [
            { label: 'All MRs', value: format(mr.authored), note: 'authored, any state', hot: false },
            { label: 'Merged', value: format(mr.merged), note: mr.rate != null ? `${mr.rate}% of decided` : '', hot: true },
            { label: 'Closed unmerged', value: format(mr.closed), note: '', hot: false },
            { label: 'Open now', value: format(mr.open), note: mr.open ? 'awaiting merge' : 'none pending', hot: false },
            { label: 'Median time to merge', value: formatDuration(mr.timeToMerge), note: '', hot: false },
            { label: 'Median review comments', value: format(mr.noteCount), note: 'per MR', hot: false },
            { label: 'MRs they merged', value: format(mr.reviewed), note: 'reviewer / integrator', hot: false },
        ];
    });

    protected readonly states = computed<Seg[]>(() => {
        const c = this.cell();
        if (!c) {
            return [];
        }
        const { merged: m, closed, open } = c.mergeRequests;
        const tot = m + closed + open;
        if (!tot) {
            return [];
        }
        return this.segs(m, closed, open, tot);
    });

    protected readonly years = computed<YearRow[]>(() => {
        const c = this.cell();
        if (!c) {
            return [];
        }
        const entries = Object.entries(c.mrYear).sort((a, b) => {
            return a[0].localeCompare(b[0]);
        });
        const rowMax = Math.max(
            1,
            ...entries.map(([, v]) => {
                return v[0] + v[1] + v[2];
            }),
        );
        return entries.map(([year, v]) => {
            const [m, closed, open] = v;
            return {
                year,
                segs: this.segs(m, closed, open, rowMax),
                summary: `${format(m)} merged · ${format(closed)} closed · ${format(open)} open`,
            };
        });
    });

    private segs(m: number, closed: number, open: number, scale: number): Seg[] {
        const defs: [number, string, string][] = [
            [m, 'var(--s2)', 'Merged'],
            [closed, 'var(--s6, var(--bad))', 'Closed'],
            [open, 'var(--s3)', 'Open'],
        ];
        return defs
            .filter(([v]) => {
                return v > 0;
            })
            .map(([value, color, label]) => {
                return { value, color, label, w: (value / scale) * 100 };
            });
    }
}
