import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AnalyticsStore, ThemeStore, FiltersStore, LINE_LABEL, LineCat, PeriodKind, format } from '../core';
import { ChartToggleComponent, mapTrendKind } from './chart.toggle.component';
import { ChartKind, ChartPoint, ChartTip, SelectOption, TrendBar, TrendChart, TrendMetric } from './types';
import { ChartTipComponent } from './chart.tooltip.component';
import { SelectComponent } from './select.component';
import { DEFAULT_TREND_METRIC, TREND_LAYOUT, TREND_METRIC } from './constants';

const { w: W, h: H, ml: ML, mr: MR, mt: MT, mb: MB } = TREND_LAYOUT;
const PW = W - ML - MR;
const PH = H - MT - MB;

@Component({
    selector: 'cp-trend',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ChartToggleComponent, ChartTipComponent, SelectComponent],
    template: `
        <div class="t-head">
            <div>
                <p class="eyebrow">Trend</p>
                <h2>{{ metric().label }} by {{ gran() }}</h2>
                <p class="sub">{{ sub() }}</p>
            </div>
            <div class="t-ctrls">
                <cp-select class="lines" label="Lines by category" [options]="lineOpts()" [value]="lineCat()" (picked)="setLineCat($event)" />
                <cp-chart-toggle [kinds]="kinds" [value]="kind()" (picked)="setKind($event)" />
            </div>
        </div>
        <div class="card">
            @if (chart(); as c) {
                @if (c.empty) {
                    <p class="empty">Not enough activity to chart.</p>
                } @else {
                    @for (pass of [renderKey()]; track pass) {
                    <div class="chart-wrap">
                    <svg viewBox="0 0 900 280" preserveAspectRatio="none" class="chart" role="img" aria-label="Activity trend" (mouseleave)="active.set(-1)">
                        @for (t of c.yTicks; track t.label) {
                            <line class="grid" [attr.x1]="ml" [attr.y1]="t.y" [attr.x2]="w - mr" [attr.y2]="t.y" />
                            <text class="tick" [attr.x]="ml - 6" [attr.y]="t.y + 3" text-anchor="end">{{ t.label }}</text>
                        }
                        @if (kind() === Kind.Area) {
                            <polygon [attr.points]="c.area" class="area" />
                            <polyline pathLength="1" [attr.points]="c.line" class="line" />
                        }
                        @if (kind() === Kind.Line) {
                            <polyline pathLength="1" [attr.points]="c.line" class="line" />
                        }
                        @if (kind() === Kind.Step) {
                            <polyline pathLength="1" [attr.points]="c.step" class="line" />
                        }
                        @if (kind() === Kind.Bar) {
                            @for (b of c.bars; track $index) {
                                <rect [attr.x]="b.x" [attr.y]="b.y" [attr.width]="b.w" [attr.height]="b.h" class="barfill" rx="1.5" />
                            }
                        }
                        @if (kind() === Kind.Dots || kind() === Kind.Line || kind() === Kind.Area) {
                            @for (d of c.dots; track $index) {
                                <circle [attr.cx]="d.x" [attr.cy]="d.y" r="2.6" class="dot" />
                            }
                        }
                        @for (t of c.xTicks; track t.label) {
                            <text class="tick" [attr.x]="t.x" [attr.y]="h - 8" text-anchor="middle">{{ t.label }}</text>
                        }
                        @if (active() >= 0 && c.points[active()]; as p) {
                            <line class="cross" [attr.x1]="p.x" [attr.y1]="mt" [attr.x2]="p.x" [attr.y2]="mt + ph" />
                            <circle class="hi" [attr.cx]="p.x" [attr.cy]="p.y" r="4" />
                        }
                        @for (p of c.points; track $index; let i = $index) {
                            <rect class="hit" [class.drillable]="drillable(p.label)" [attr.x]="p.x - bandWidth() / 2" [attr.y]="mt" [attr.width]="bandWidth()" [attr.height]="ph" (mouseenter)="active.set(i)" (click)="drill(p.label)" />
                        }
                    </svg>
                    <cp-chart-tip [tip]="tip()" />
                    </div>
                    }
                }
            }
        </div>
    `,
    styles: `
        :host {
            display: block;
        }
        .t-head {
            margin-bottom: 12px;
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
            flex-wrap: wrap;
        }
        .t-ctrls {
            display: flex;
            align-items: flex-end;
            gap: 10px;
            flex-wrap: wrap;
        }
        .lines {
            min-width: 178px;
        }
        .barfill {
            fill: var(--acc);
            opacity: 0.55;
        }
        .eyebrow {
            font: 700 10px var(--font);
            letter-spacing: 0.08em;
            color: var(--muted);
            margin: 0 0 3px;
        }
        .t-head h2 {
            font: 700 19px var(--font-d);
            margin: 0;
            color: var(--ink);
        }
        .sub {
            font-size: 12.5px;
            color: var(--muted);
            margin: 3px 0 0;
        }
        .card {
            background: var(--glass, var(--surface));
            border: 1px solid var(--glass-brd, var(--line));
            border-radius: var(--radius, 14px);
            padding: 14px;
        }
        .chart-wrap {
            position: relative;
        }
        .chart {
            width: 100%;
            height: 280px;
            display: block;
        }
        .hit {
            fill: transparent;
            cursor: crosshair;
        }
        .hit.drillable {
            cursor: pointer;
        }
        .cross {
            stroke: var(--acc);
            stroke-width: 1;
            stroke-dasharray: 3 3;
            opacity: 0.55;
        }
        .hi {
            fill: var(--acc);
            stroke: var(--surface);
            stroke-width: 1.5;
        }
        .grid {
            stroke: var(--line-2, var(--line));
            stroke-width: 1;
        }
        .tick {
            fill: var(--muted);
            font: 500 10px var(--font);
        }
        .area {
            fill: var(--acc);
            fill-opacity: 0.14;
        }
        .line {
            fill: none;
            stroke: var(--acc);
            stroke-width: 2.6;
            stroke-linejoin: round;
            stroke-linecap: round;
        }
        .dot {
            fill: var(--acc);
        }
        .empty {
            padding: 30px;
            text-align: center;
            color: var(--muted);
        }
    `,
})
export class TrendComponent {
    private readonly analytics = inject(AnalyticsStore);
    private readonly filters = inject(FiltersStore);

    protected readonly w = W;
    protected readonly h = H;
    protected readonly ml = ML;
    protected readonly mr = MR;
    protected readonly mt = MT;
    protected readonly ph = PH;
    protected readonly active = signal<number>(-1);

    private readonly theme = inject(ThemeStore);
    protected readonly Kind = ChartKind;
    protected readonly kinds: ChartKind[] = [ChartKind.Area, ChartKind.Line, ChartKind.Step, ChartKind.Bar, ChartKind.Dots];
    private readonly userKind = signal<ChartKind | undefined>(undefined);
    protected readonly kind = computed<ChartKind>(() => {
        return this.userKind() ?? mapTrendKind(this.theme.charts().trend);
    });

    protected setKind(k: ChartKind) {
        this.userKind.set(k);
    }

    protected readonly gran = computed<string>(() => {
        return this.analytics.selectedCell()?.series.gran || 'period';
    });

    protected readonly metric = computed<TrendMetric>(() => {
        return TREND_METRIC[this.filters.sortKey()] ?? DEFAULT_TREND_METRIC;
    });

    // Changes whenever the plotted data changes, so the chart re-creates and its
    // entrance animation replays on person / filter / metric changes (not just load).
    protected readonly renderKey = computed<string>(() => {
        const chart = this.chart();
        return `${this.kind()}:${chart.points.map((p) => p.value).join(',')}`;
    });

    protected readonly lineCat = this.filters.lineCat;
    protected readonly lineOpts = computed<SelectOption[]>(() => {
        return (Object.keys(LINE_LABEL) as LineCat[]).map((value) => {
            return { value, label: LINE_LABEL[value] };
        });
    });

    protected setLineCat(value: string) {
        this.filters.lineCat.set(value as LineCat);
    }

    protected readonly sub = computed<string>(() => {
        const c = this.analytics.selectedCell();
        if (!c) {
            return '';
        }
        const m = this.metric();
        const total = c.series.keys.reduce((sum, k) => {
            return sum + c.series.data[k][m.index];
        }, 0);
        const n = c.series.keys.length;
        return `${n} ${c.series.gran}${n === 1 ? '' : 's'} · ${format(total)} ${m.label.toLowerCase()}`;
    });

    protected readonly chart = computed<TrendChart>(() => {
        const cell = this.analytics.selectedCell();
        const keys = cell?.series.keys ?? [];
        if (keys.length < 2) {
            return { empty: true, line: '', area: '', step: '', bars: [], yTicks: [], xTicks: [], dots: [], points: [] };
        }
        const idx = this.metric().index;
        const vals = keys.map((k) => {
            return cell!.series.data[k][idx];
        });
        const max = Math.max(1, ...vals);
        const n = keys.length;
        const xOf = (i: number): number => {
            return ML + (i / (n - 1)) * PW;
        };
        const yOf = (v: number): number => {
            return MT + PH - PH * (v / max);
        };
        const dots = vals.map((v, i) => {
            return { x: +xOf(i).toFixed(1), y: +yOf(v).toFixed(1) };
        });
        const points: ChartPoint[] = vals.map((v, i) => {
            return { x: dots[i].x, y: dots[i].y, label: keys[i], value: format(v) };
        });
        const line = dots
            .map((d) => {
                return `${d.x},${d.y}`;
            })
            .join(' ');
        const area = `${ML},${MT + PH} ${line} ${(ML + PW).toFixed(1)},${MT + PH}`;
        const stepPts: string[] = [];
        dots.forEach((d, i) => {
            if (i > 0) {
                stepPts.push(`${d.x},${dots[i - 1].y}`);
            }
            stepPts.push(`${d.x},${d.y}`);
        });
        const step = stepPts.join(' ');
        const bw = n > 1 ? (PW / n) * 0.7 : PW * 0.5;
        const bars: TrendBar[] = vals.map((v, i) => {
            const y = yOf(v);
            return { x: +(xOf(i) - bw / 2).toFixed(1), y: +y.toFixed(1), w: +bw.toFixed(1), h: +(MT + PH - y).toFixed(1) };
        });
        const yTicks = [0, 1, 2, 3].map((i) => {
            return { y: +(MT + PH - (PH * i) / 3).toFixed(1), label: format((max * i) / 3) };
        });
        const gran = cell!.series.gran;
        const tickStep = Math.max(1, Math.ceil(n / 8));
        const xTicks: { x: number; label: string }[] = [];
        keys.forEach((k, i) => {
            if (i % tickStep === 0 || i === n - 1) {
                xTicks.push({ x: +xOf(i).toFixed(1), label: this.tickLabel(k, gran) });
            }
        });
        return { empty: false, line, area, step, bars, yTicks, xTicks, dots, points };
    });

    protected readonly tip = computed<ChartTip | undefined>(() => {
        const i = this.active();
        const points = this.chart().points;
        if (i < 0 || i >= points.length) {
            return undefined;
        }
        const p = points[i];
        const data = this.analytics.selectedCell()?.series.data[p.label];
        if (!data) {
            return undefined;
        }
        const activeIndex = this.metric().index;
        const metrics = [
            { index: 0, label: 'Commits', color: 'var(--s1)' },
            { index: 1, label: 'Lines changed', color: 'var(--s2)' },
            { index: 2, label: 'Code lines', color: 'var(--s3)' },
            { index: 3, label: 'Merges', color: 'var(--s4)' },
            { index: 4, label: 'MRs merged', color: 'var(--s5)' },
        ];
        const ordered = metrics.filter((m) => {
            return m.index === activeIndex;
        });
        for (const m of metrics) {
            if (m.index !== activeIndex) {
                ordered.push(m);
            }
        }
        return {
            xPct: (p.x / 900) * 100,
            title: p.label,
            rows: ordered.map((m) => {
                return { label: m.label, value: format(data[m.index]), color: m.color, active: m.index === activeIndex };
            }),
        };
    });

    protected bandWidth(): number {
        const n = this.chart().points.length;
        return n ? PW / n : 0;
    }

    private tickLabel(key: string, gran: string): string {
        if (gran === 'day' || gran === 'week') {
            return key.slice(5);
        }
        return gran === 'month' ? key.slice(0, 7) : key.slice(0, 4);
    }

    protected drillable(key: string): boolean {
        return /^\d{4}$/.test(key) || /^\d{4}-\d{2}$/.test(key);
    }

    protected drill(key: string) {
        if (/^\d{4}$/.test(key)) {
            this.filters.period.set({ kind: PeriodKind.Year, year: key });
            return;
        }
        const month = key.match(/^(\d{4})-(\d{2})$/);
        if (month) {
            const lastDay = new Date(Number(month[1]), Number(month[2]), 0).getDate();
            this.filters.period.set({ kind: PeriodKind.Range, from: `${key}-01`, to: `${key}-${String(lastDay).padStart(2, '0')}` });
        }
    }
}
