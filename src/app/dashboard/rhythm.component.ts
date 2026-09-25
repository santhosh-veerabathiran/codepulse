import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AnalyticsStore, FiltersStore, format } from '../core';
import { RecordCard } from './types';
import { DAY, MONTHS } from './constants';

@Component({
    selector: 'cp-rhythm',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="head">
            <p class="eyebrow">Cadence</p>
            <h2>{{ name() }} — rhythm, streaks &amp; records</h2>
            <p class="sub">Consistency and personal bests within the current repo &amp; period.</p>
        </div>
        @if (records(); as rs) {
            <div class="records">
                @for (r of rs; track r.label) {
                    <div class="rec" [style.--rc]="r.color">
                        <span class="r-l">{{ r.label }}</span>
                        <span class="r-v">{{ r.value }}</span>
                        <span class="r-s">{{ r.sub }}</span>
                    </div>
                }
            </div>
        } @else {
            <p class="empty">No activity in this view.</p>
        }
    `,
    styles: `
        :host {
            display: block;
        }
        .head {
            margin-bottom: 14px;
        }
        .eyebrow {
            font: 700 10px var(--font);
            letter-spacing: 0.08em;
            color: var(--acc-ink, var(--acc));
            margin: 0 0 4px;
        }
        h2 {
            font: 800 17px var(--font-d, var(--font));
            margin: 0;
            color: var(--ink);
        }
        .sub {
            font-size: 12.5px;
            color: var(--muted);
            margin: 4px 0 0;
        }
        .records {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 12px;
        }
        .rec {
            background: var(--glass, var(--surface));
            border: 1px solid var(--glass-brd, var(--line));
            border-left: 3px solid var(--rc, var(--acc));
            border-radius: var(--radius, 14px);
            padding: 15px 17px;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        .r-l {
            font: 700 10.5px var(--font);
            letter-spacing: 0.04em;
            color: var(--muted);
        }
        .r-v {
            font: 800 24px var(--font-d, var(--font));
            color: var(--ink);
            font-variant-numeric: tabular-nums;
        }
        .r-s {
            font-size: 11.5px;
            color: var(--muted);
        }
        .empty {
            padding: 30px;
            text-align: center;
            color: var(--muted);
            background: var(--glass, var(--surface));
            border: 1px solid var(--glass-brd, var(--line));
            border-radius: var(--radius, 14px);
        }
    `,
})
export class RhythmComponent {
    private readonly analytics = inject(AnalyticsStore);
    private readonly filters = inject(FiltersStore);

    protected readonly name = computed<string>(() => {
        return this.analytics.personName(this.filters.personId());
    });

    protected readonly records = computed<RecordCard[] | undefined>(() => {
        const cell = this.analytics.selectedCell();
        if (!cell || !Object.keys(cell.daily).length) {
            return;
        }
        const daily = cell.daily;
        const dates = Object.keys(daily).sort();
        const longest = this.longestStreak(dates);
        const current = this.currentStreak(dates);
        const bestDay = this.bestDay(daily);
        const bestWeek = this.bestWeek(daily);
        const bestMonth = this.bestMonth(cell.month);
        const perDay = cell.days ? cell.commits / cell.days : 0;
        return [
            { label: 'Longest streak', value: `${longest.len} ${longest.len === 1 ? 'day' : 'days'}`, sub: longest.len ? `${longest.from} → ${longest.to}` : '—', color: 'var(--s1)' },
            { label: 'Current streak', value: `${current} ${current === 1 ? 'day' : 'days'}`, sub: current ? `up to ${dates[dates.length - 1]}` : 'inactive at period end', color: 'var(--s2)' },
            { label: 'Busiest day', value: format(bestDay.count), sub: bestDay.date || '—', color: 'var(--s3)' },
            { label: 'Busiest week', value: format(bestWeek.count), sub: bestWeek.monday ? `week of ${bestWeek.monday}` : '—', color: 'var(--s5)' },
            { label: 'Busiest month', value: format(bestMonth.count), sub: bestMonth.label || '—', color: 'var(--s7)' },
            { label: 'Commits / active day', value: perDay.toFixed(1), sub: `${format(cell.days)} active days`, color: 'var(--s8, var(--acc))' },
        ];
    });

    private longestStreak(dates: string[]): { len: number; from: string; to: string } {
        let best = { len: 0, from: '', to: '' };
        let runStart = '';
        let prev = '';
        let len = 0;
        for (const d of dates) {
            if (prev && this.isNext(prev, d)) {
                len++;
            } else {
                runStart = d;
                len = 1;
            }
            if (len > best.len) {
                best = { len, from: runStart, to: d };
            }
            prev = d;
        }
        return best;
    }

    private currentStreak(dates: string[]): number {
        let len = 0;
        for (let i = dates.length - 1; i >= 0; i--) {
            if (i === dates.length - 1 || this.isNext(dates[i], dates[i + 1])) {
                len++;
            } else {
                break;
            }
        }
        return len;
    }

    private bestDay(daily: Record<string, number>): { date: string; count: number } {
        let date = '';
        let count = 0;
        for (const [d, n] of Object.entries(daily)) {
            if (n > count) {
                count = n;
                date = d;
            }
        }
        return { date, count };
    }

    private bestWeek(daily: Record<string, number>): { monday: string; count: number } {
        const weeks: Record<string, number> = {};
        for (const [d, n] of Object.entries(daily)) {
            const key = this.mondayOf(d);
            weeks[key] = (weeks[key] || 0) + n;
        }
        let monday = '';
        let count = 0;
        for (const [w, n] of Object.entries(weeks)) {
            if (n > count) {
                count = n;
                monday = w;
            }
        }
        return { monday, count };
    }

    private bestMonth(month: Record<string, number[]>): { label: string; count: number } {
        let key = '';
        let count = 0;
        for (const [m, v] of Object.entries(month)) {
            if (v[0] > count) {
                count = v[0];
                key = m;
            }
        }
        if (!key) {
            return { label: '', count: 0 };
        }
        return { label: `${MONTHS[Number(key.slice(5)) - 1]} ${key.slice(0, 4)}`, count };
    }

    private isNext(a: string, b: string): boolean {
        const at = new Date(a + 'T00:00:00').getTime();
        const bt = new Date(b + 'T00:00:00').getTime();
        return bt - at === DAY;
    }

    private mondayOf(dateStr: string): string {
        const dt = new Date(dateStr + 'T00:00:00');
        const day = (dt.getDay() + 6) % 7;
        const monday = new Date(dt.getTime() - day * DAY);
        return this.iso(monday);
    }

    private iso(d: Date): string {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
}
