import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AnalyticsStore, FiltersStore, format } from '../core';
import { CalCell, Calendar, DowBar, Stat } from './types';
import { DOW_NAMES, DOW_SHORT, HEATMAP_LEVELS, MONTHS } from './constants';

@Component({
    selector: 'cp-activity',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="head">
            <p class="eyebrow">Cadence</p>
            <h2>{{ name() }} — activity</h2>
            <p class="sub">When the work happens — daily commit heatmap and weekday rhythm, within the current repo &amp; period.</p>
        </div>

        @if (!cell()) {
            <p class="empty card">No activity in this view.</p>
        } @else {
            <div class="stats">
                @for (s of stats(); track s.label) {
                    <div class="stat card">
                        <span class="s-l">{{ s.label }}</span>
                        <span class="s-v">{{ s.value }}</span>
                    </div>
                }
            </div>

            <div class="card block">
                <p class="bh">Daily commits</p>
                @if (calendar().hasData) {
                    <div class="cal-wrap">
                        <div class="cal">
                            @for (w of calendar().weeks; track $index) {
                                <div class="col">
                                    @for (d of w; track d.date) {
                                        <span class="cell" [style.background]="d.bg" [title]="d.title"></span>
                                    }
                                </div>
                            }
                        </div>
                    </div>
                    <div class="cal-legend">
                        <span>Less</span>
                        @for (b of legend; track $index) {
                            <span class="sw" [style.background]="b"></span>
                        }
                        <span>More</span>
                    </div>
                } @else {
                    <p class="empty">No dated commits to plot.</p>
                }
            </div>

            <div class="card block">
                <p class="bh">Weekday rhythm</p>
                <div class="dow">
                    @for (b of weekdays(); track b.name) {
                        <div class="dw" [title]="b.name + ': ' + b.count">
                            <div class="dw-bar">
                                <div class="dw-fill" [style.height.%]="b.height"></div>
                            </div>
                            <span class="dw-l">{{ b.label }}</span>
                        </div>
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
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 12px;
            margin-bottom: 16px;
        }
        .stat {
            padding: 13px 15px;
            display: flex;
            flex-direction: column;
            gap: 4px;
            border-left: 3px solid var(--acc);
        }
        .s-l {
            font: 700 10.5px var(--font);
            letter-spacing: 0.04em;
            color: var(--muted);
        }
        .s-v {
            font: 800 22px/1 var(--font-d);
            color: var(--ink);
            font-variant-numeric: tabular-nums;
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
        .cal-wrap {
            overflow-x: auto;
            padding-bottom: 4px;
        }
        .cal {
            display: flex;
            gap: 3px;
            width: max-content;
        }
        .col {
            display: flex;
            flex-direction: column;
            gap: 3px;
        }
        .cell {
            width: 13px;
            height: 13px;
            border-radius: 3px;
            display: block;
        }
        .cal-legend {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-top: 12px;
            font-size: 11px;
            color: var(--muted);
        }
        .cal-legend .sw {
            width: 13px;
            height: 13px;
            border-radius: 3px;
        }
        .dow {
            display: flex;
            align-items: flex-end;
            gap: 10px;
            height: 140px;
        }
        .dw {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            height: 100%;
            justify-content: flex-end;
        }
        .dw-bar {
            width: 100%;
            max-width: 46px;
            flex: 1;
            display: flex;
            align-items: flex-end;
        }
        .dw-fill {
            width: 100%;
            border-radius: 6px 6px 3px 3px;
            background: linear-gradient(180deg, var(--acc), color-mix(in srgb, var(--acc) 35%, transparent));
            min-height: 2px;
        }
        .dw-l {
            font: 600 11px var(--mono);
            color: var(--muted);
        }
        .empty {
            padding: 30px;
            text-align: center;
            color: var(--muted);
        }
    `,
})
export class ActivityComponent {
    private readonly analytics = inject(AnalyticsStore);
    private readonly filters = inject(FiltersStore);

    protected readonly legend = HEATMAP_LEVELS;
    protected readonly cell = this.analytics.selectedCell;
    protected readonly name = computed<string>(() => {
        return this.analytics.personName(this.filters.personId());
    });

    protected readonly stats = computed<Stat[]>(() => {
        const c = this.cell();
        if (!c) {
            return [];
        }
        return [
            { label: 'Active days', value: format(c.days) },
            { label: 'Busiest weekday', value: this.busiestWeekday(c.dow) },
            { label: 'Most active month', value: this.topMonth(c.month) },
            { label: 'Commits / active day', value: (c.days ? c.commits / c.days : 0).toFixed(1) },
        ];
    });

    protected readonly weekdays = computed<DowBar[]>(() => {
        const c = this.cell();
        if (!c) {
            return [];
        }
        const max = Math.max(1, ...c.dow);
        return c.dow.map((count, i) => {
            return { label: DOW_SHORT[i], name: DOW_NAMES[i], count, height: (count / max) * 100 };
        });
    });

    protected readonly calendar = computed<Calendar>(() => {
        const c = this.cell();
        if (!c || !c.range[0]) {
            return { weeks: [], hasData: false };
        }
        const max = Math.max(1, ...Object.values(c.daily));
        const weeks = this.buildWeeks(c.daily, c.range[0], c.range[1], max);
        return { weeks: weeks.slice(-53), hasData: weeks.length > 0 };
    });

    private buildWeeks(daily: Record<string, number>, from: string, to: string, max: number): CalCell[][] {
        const weeks: CalCell[][] = [];
        const cursor = this.mondayOf(from);
        const end = new Date(to + 'T00:00:00');
        let col: CalCell[] = [];
        let guard = 0;
        while (cursor <= end && guard < 4000) {
            const ds = this.iso(cursor);
            const count = daily[ds] || 0;
            col.push({ date: ds, count, bg: HEATMAP_LEVELS[this.level(count, max)], title: `${ds}: ${count} commit${count === 1 ? '' : 's'}` });
            if (col.length === 7) {
                weeks.push(col);
                col = [];
            }
            cursor.setDate(cursor.getDate() + 1);
            guard++;
        }
        if (col.length) {
            weeks.push(col);
        }
        return weeks;
    }

    private level(count: number, max: number): number {
        if (count === 0) {
            return 0;
        }
        if (count >= max * 0.75) {
            return 4;
        }
        if (count >= max * 0.5) {
            return 3;
        }
        if (count >= max * 0.25) {
            return 2;
        }
        return 1;
    }

    private busiestWeekday(dow: number[]): string {
        const max = Math.max(...dow);
        if (max <= 0) {
            return '—';
        }
        return DOW_NAMES[dow.indexOf(max)];
    }

    private topMonth(month: Record<string, number[]>): string {
        const top = Object.entries(month).sort((a, b) => {
            return b[1][0] - a[1][0];
        })[0];
        if (!top) {
            return '—';
        }
        return `${MONTHS[Number(top[0].slice(5, 7)) - 1]} ${top[0].slice(0, 4)}`;
    }

    private mondayOf(date: string): Date {
        const d = new Date(date + 'T00:00:00');
        const wd = (d.getDay() + 6) % 7;
        d.setDate(d.getDate() - wd);
        return d;
    }

    private iso(d: Date): string {
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${d.getFullYear()}-${m}-${day}`;
    }
}
