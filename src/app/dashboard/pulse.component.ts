import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ALL, AnalyticsStore, Cell, FiltersStore, format, formatCompact, formatDuration, percent, ThemeStore } from '../core';
import { ChartToggleComponent } from './chart.toggle.component';
import { ChartTipComponent } from './chart.tooltip.component';
import { EMPTY_SERIES, PULSE_LAYOUT } from './constants';
import { ReplayDirective } from './replay.directive';
import { ChartKind, ChartPoint, ChartTip, PulseKpi, SeriesChart, Tick } from './types';
import { mapTrendKind } from './utils';

const { w: W, h: H, ml: ML, mr: MR, mt: MT, mb: MB } = PULSE_LAYOUT;
const PW = W - ML - MR;
const PH = H - MT - MB;

@Component({
    selector: 'cp-pulse',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ChartToggleComponent, ChartTipComponent, ReplayDirective],
    template: `
        <div class="head">
            <p class="eyebrow">Team Pulse</p>
            <h2>How the Team Is Doing</h2>
        </div>

        @if (!cell()) {
            <p class="empty card">No team activity in this view.</p>
        } @else {
            <div class="kpis" *cpReplay="viewKey()">
                @for (k of kpis(); track k.label) {
                    <div class="kpi">
                        <span class="k-l">{{ k.label }}</span>
                        <span class="k-v">{{ k.value }}</span>
                    </div>
                }
            </div>

            <div class="grid">
                <div class="card" *cpReplay="viewKey()">
                    <div class="chead">
                        <p class="ch">Commits per {{ gran() }}</p>
                        <cp-chart-toggle [kinds]="commitsKinds" [value]="commitsKind()" (picked)="setCommitsKind($event)" />
                    </div>
                    @if (commits(); as a) {
                        @if (a.empty) {
                            <p class="empty">Not enough data to chart.</p>
                        } @else {
                            @for (pass of [keyCommits()]; track pass) {
                                <div class="chart-wrap">
                                    <svg viewBox="0 0 900 220" preserveAspectRatio="none" class="chart" role="img" aria-label="Commits per period" (mouseleave)="activeCommits.set(-1)">
                                        @for (t of a.yTicks; track t.label) {
                                            <line class="grid" [attr.x1]="ml" [attr.y1]="t.y" [attr.x2]="w - mr" [attr.y2]="t.y" />
                                            <text class="tick" [attr.x]="ml - 6" [attr.y]="t.y! + 3" text-anchor="end">{{ t.label }}</text>
                                        }
                                        @if (commitsKind() === Kind.Area) {
                                            <polygon [attr.points]="a.area" class="area" />
                                            <polyline pathLength="1" [attr.points]="a.line" class="line" />
                                        }
                                        @if (commitsKind() === Kind.Line) {
                                            <polyline pathLength="1" [attr.points]="a.line" class="line" />
                                        }
                                        @if (commitsKind() === Kind.Step) {
                                            <polyline pathLength="1" [attr.points]="a.step" class="line" />
                                        }
                                        @if (commitsKind() === Kind.Bar) {
                                            @for (b of a.bars; track $index) {
                                                <rect [attr.x]="b.x" [attr.y]="b.y" [attr.width]="b.w" [attr.height]="b.h" class="barfill" rx="1.5" />
                                            }
                                        }
                                        @if (commitsKind() === Kind.Dots || commitsKind() === Kind.Line || commitsKind() === Kind.Area) {
                                            @for (d of a.dots; track $index) {
                                                <circle [attr.cx]="d.x" [attr.cy]="d.y" r="2.6" class="dot" />
                                            }
                                        }
                                        @for (t of a.xTicks; track t.label) {
                                            <text class="tick" [attr.x]="t.x" [attr.y]="h - 8" text-anchor="middle">{{ t.label }}</text>
                                        }
                                        @if (activeCommits() >= 0 && a.points[activeCommits()]; as p) {
                                            <line class="cross" [attr.x1]="p.x" [attr.y1]="mt" [attr.x2]="p.x" [attr.y2]="mt + ph" />
                                            <circle class="hi" [attr.cx]="p.x" [attr.cy]="p.y" r="4" />
                                        }
                                        @for (p of a.points; track $index; let i = $index) {
                                            <rect class="hit" [attr.x]="p.x - bandWidth(a.points) / 2" [attr.y]="mt" [attr.width]="bandWidth(a.points)" [attr.height]="ph" (mouseenter)="activeCommits.set(i)" />
                                        }
                                    </svg>
                                    <cp-chart-tip [tip]="tipCommits()" />
                                </div>
                            }
                        }
                    }
                </div>

                <div class="card" *cpReplay="viewKey()">
                    <div class="chead">
                        <p class="ch">MRs merged per {{ gran() }}</p>
                        <cp-chart-toggle [kinds]="mrsKinds" [value]="mrsKind()" (picked)="mrsKind.set($event)" />
                    </div>
                    @if (merges(); as b) {
                        @if (b.empty) {
                            <p class="empty">Not enough data to chart.</p>
                        } @else {
                            @for (pass of [keyMerges()]; track pass) {
                                <div class="chart-wrap">
                                    <svg viewBox="0 0 900 220" preserveAspectRatio="none" class="chart" role="img" aria-label="MRs merged per period" (mouseleave)="activeMerges.set(-1)">
                                        @for (t of b.yTicks; track t.label) {
                                            <line class="grid" [attr.x1]="ml" [attr.y1]="t.y" [attr.x2]="w - mr" [attr.y2]="t.y" />
                                            <text class="tick" [attr.x]="ml - 6" [attr.y]="t.y! + 3" text-anchor="end">{{ t.label }}</text>
                                        }
                                        @if (mrsKind() === Kind.Bar) {
                                            @for (bar of b.bars; track $index) {
                                                <rect class="bar" [attr.x]="bar.x" [attr.y]="bar.y" [attr.width]="bar.w" [attr.height]="bar.h" rx="1.5" />
                                            }
                                        }
                                        @if (mrsKind() === Kind.Area) {
                                            <polygon [attr.points]="b.area" class="area-2" />
                                            <polyline pathLength="1" [attr.points]="b.line" class="line-2" />
                                        }
                                        @if (mrsKind() === Kind.Line) {
                                            <polyline pathLength="1" [attr.points]="b.line" class="line-2" />
                                            @for (d of b.dots; track $index) {
                                                <circle [attr.cx]="d.x" [attr.cy]="d.y" r="2.6" class="dot-2" />
                                            }
                                        }
                                        @for (t of b.xTicks; track t.label) {
                                            <text class="tick" [attr.x]="t.x" [attr.y]="h - 8" text-anchor="middle">{{ t.label }}</text>
                                        }
                                        @if (activeMerges() >= 0 && b.points[activeMerges()]; as p) {
                                            <line class="cross" [attr.x1]="p.x" [attr.y1]="mt" [attr.x2]="p.x" [attr.y2]="mt + ph" />
                                            <circle class="hi" [attr.cx]="p.x" [attr.cy]="p.y" r="4" />
                                        }
                                        @for (p of b.points; track $index; let i = $index) {
                                            <rect class="hit" [attr.x]="p.x - bandWidth(b.points) / 2" [attr.y]="mt" [attr.width]="bandWidth(b.points)" [attr.height]="ph" (mouseenter)="activeMerges.set(i)" />
                                        }
                                    </svg>
                                    <cp-chart-tip [tip]="tipMerges()" />
                                </div>
                            }
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
            margin-bottom: 14px;
        }
        .eyebrow {
            font: 700 10px var(--font);
            letter-spacing: 0.08em;
            color: var(--muted);
            margin: 0 0 3px;
        }
        h2 {
            font: 800 19px var(--font-d, var(--font));
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
        .kpis {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 12px;
            margin-bottom: 16px;
        }
        .kpi {
            background: var(--glass, var(--surface));
            border: 1px solid var(--glass-brd, var(--line));
            border-left: 3px solid var(--acc);
            border-radius: var(--radius, 14px);
            padding: 13px 15px;
            display: flex;
            flex-direction: column;
            gap: 3px;
        }
        .k-l {
            font: 700 10.5px var(--font);
            letter-spacing: 0.04em;
            color: var(--muted);
        }
        .k-v {
            font: 800 24px/1 var(--font-d, var(--font));
            color: var(--ink);
            font-variant-numeric: tabular-nums;
        }
        .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }
        .chead {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 12px;
        }
        .ch {
            font: 700 11px var(--font);
            letter-spacing: 0.04em;
            color: var(--muted);
            margin: 0;
        }
        .chart-wrap {
            position: relative;
        }
        .chart {
            width: 100%;
            height: 220px;
            display: block;
        }
        .hit {
            fill: transparent;
            cursor: crosshair;
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
        .grid-line,
        .chart .grid {
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
            stroke-width: 2.4;
            stroke-linejoin: round;
            stroke-linecap: round;
        }
        .dot {
            fill: var(--acc);
        }
        .barfill {
            fill: var(--acc);
            opacity: 0.55;
        }
        .bar {
            fill: var(--s2);
        }
        .area-2 {
            fill: var(--s2);
            fill-opacity: 0.3;
        }
        .line-2 {
            fill: none;
            stroke: var(--s2);
            stroke-width: 2.4;
            stroke-linejoin: round;
            stroke-linecap: round;
        }
        .dot-2 {
            fill: var(--s2);
        }
        .empty {
            padding: 24px;
            text-align: center;
            color: var(--muted);
        }
        @media (max-width: 800px) {
            .grid {
                grid-template-columns: 1fr;
            }
        }
    `,
})
export class PulseComponent {
    private readonly analytics = inject(AnalyticsStore);
    private readonly filters = inject(FiltersStore);
    protected readonly viewKey = this.filters.viewKey;
    private readonly theme = inject(ThemeStore);

    protected readonly w = W;
    protected readonly h = H;
    protected readonly ml = ML;
    protected readonly mr = MR;
    protected readonly mt = MT;
    protected readonly ph = PH;
    protected readonly activeCommits = signal<number>(-1);
    protected readonly activeMerges = signal<number>(-1);

    protected readonly Kind = ChartKind;
    protected readonly commitsKinds: ChartKind[] = [ChartKind.Area, ChartKind.Line, ChartKind.Step, ChartKind.Bar, ChartKind.Dots];
    private readonly userCommitsKind = signal<ChartKind | undefined>(undefined);
    protected readonly commitsKind = computed<ChartKind>(() => {
        return this.userCommitsKind() ?? mapTrendKind(this.theme.charts().trend);
    });
    protected readonly mrsKinds: ChartKind[] = [ChartKind.Bar, ChartKind.Line, ChartKind.Area];
    protected readonly mrsKind = signal<ChartKind>(ChartKind.Bar);

    protected setCommitsKind(k: ChartKind) {
        this.userCommitsKind.set(k);
    }

    protected readonly cell = computed<Cell | null>(() => {
        return this.analytics.buildCell(ALL);
    });
    protected readonly gran = computed<string>(() => {
        return this.cell()?.series.gran || 'period';
    });

    protected readonly kpis = computed<PulseKpi[]>(() => {
        const c = this.cell();
        if (!c) {
            return [];
        }
        return [
            { label: 'Commits', value: format(c.commits) },
            { label: 'MRs merged', value: format(c.mergeRequests.merged) },
            { label: 'Review coverage', value: `${percent(c.mergeRequests.reviewed, c.mergeRequests.merged).toFixed(0)}%` },
            { label: 'Median time to merge', value: formatDuration(c.mergeRequests.timeToMerge) },
        ];
    });

    protected readonly commits = computed<SeriesChart>(() => {
        return this.build(0);
    });
    protected readonly merges = computed<SeriesChart>(() => {
        return this.build(4);
    });

    protected readonly tipCommits = computed<ChartTip | undefined>(() => {
        return this.buildTip(this.commits().points, this.activeCommits(), 'Commits');
    });
    protected readonly tipMerges = computed<ChartTip | undefined>(() => {
        return this.buildTip(this.merges().points, this.activeMerges(), 'MRs merged');
    });

    protected readonly keyCommits = computed<string>(() => {
        return `${this.commitsKind()}:${this.commits()
            .points.map((p) => p.value)
            .join(',')}`;
    });
    protected readonly keyMerges = computed<string>(() => {
        return `${this.mrsKind()}:${this.merges()
            .points.map((p) => p.value)
            .join(',')}`;
    });

    private buildTip(points: ChartPoint[], index: number, label: string): ChartTip | undefined {
        if (index < 0 || index >= points.length) {
            return;
        }
        const p = points[index];
        return { xPct: (p.x / 900) * 100, title: p.label, rows: [{ label, value: p.value, color: 'var(--acc)' }] };
    }

    protected bandWidth(points: ChartPoint[]): number {
        return points.length ? PW / points.length : 0;
    }

    private build(idx: number): SeriesChart {
        const c = this.cell();
        const keys = c?.series.keys ?? [];
        if (keys.length < 2) {
            return EMPTY_SERIES;
        }
        const vals = keys.map((k) => {
            return c!.series.data[k][idx];
        });
        const max = Math.max(1, ...vals);
        const n = keys.length;
        const slot = PW / n;
        const centerOf = (i: number): number => {
            return ML + slot * i + slot / 2;
        };
        const yOf = (v: number): number => {
            return MT + PH - PH * (v / max);
        };
        const dots = vals.map((v, i) => {
            return { x: +centerOf(i).toFixed(1), y: +yOf(v).toFixed(1) };
        });
        const points: ChartPoint[] = vals.map((v, i) => {
            return { x: dots[i].x, y: dots[i].y, label: keys[i], value: format(v) };
        });
        const line = dots
            .map((d) => {
                return `${d.x},${d.y}`;
            })
            .join(' ');
        const area = `${dots[0].x},${MT + PH} ${line} ${dots[n - 1].x},${MT + PH}`;
        const stepPts: string[] = [];
        dots.forEach((d, i) => {
            if (i > 0) {
                stepPts.push(`${d.x},${dots[i - 1].y}`);
            }
            stepPts.push(`${d.x},${d.y}`);
        });
        const step = stepPts.join(' ');
        const bw = Math.max(1, slot * 0.62);
        const bars = vals.map((v, i) => {
            const bh = PH * (v / max);
            return { x: +(centerOf(i) - bw / 2).toFixed(1), y: +(MT + PH - bh).toFixed(1), w: +bw.toFixed(1), h: +bh.toFixed(1) };
        });
        return { empty: false, line, area, step, bars, dots, yTicks: this.yTicks(max), xTicks: this.xTicks(keys, centerOf, c!.series.gran), points };
    }

    private yTicks(max: number): Tick[] {
        return [0, 1, 2, 3].map((i) => {
            return { y: +(MT + PH - (PH * i) / 3).toFixed(1), label: formatCompact((max * i) / 3) };
        });
    }

    private xTicks(keys: string[], xOf: (i: number) => number, gran: string): Tick[] {
        const n = keys.length;
        const step = Math.max(1, Math.ceil(n / 8));
        const ticks: Tick[] = [];
        keys.forEach((k, i) => {
            if (i % step === 0 || i === n - 1) {
                ticks.push({ x: +xOf(i).toFixed(1), label: this.tickLabel(k, gran) });
            }
        });
        return ticks;
    }

    private tickLabel(key: string, gran: string): string {
        if (gran === 'day' || gran === 'week') {
            return key.slice(5);
        }
        return gran === 'month' ? key.slice(0, 7) : key.slice(0, 4);
    }
}
