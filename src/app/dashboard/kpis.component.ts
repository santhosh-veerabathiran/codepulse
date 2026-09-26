import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AnalyticsStore, Cell, FiltersStore, format, formatCompact, formatDuration, percent } from '../core';
import { CountUpDirective } from './count.up.directive';
import { Delta, KpiCard, KpiSpec } from './types';

@Component({
    selector: 'cp-kpis',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CountUpDirective],
    template: `
        <div class="who">
            <p class="eyebrow">Selected</p>
            <h2>{{ name() }}</h2>
        </div>
        @for (pass of [renderKey()]; track pass) {
            <div class="kpis">
                @for (k of cards(); track k.label; let i = $index) {
                    <div class="kpi" [style.--kc]="k.color" [style.--i]="i">
                        <div class="k-top">
                            <span class="k-ic">
                                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                    @switch (k.icon) {
                                        @case ('commits') {
                                            <circle cx="12" cy="12" r="3.5" />
                                            <line x1="2" y1="12" x2="8.5" y2="12" />
                                            <line x1="15.5" y1="12" x2="22" y2="12" />
                                        }
                                        @case ('code') {
                                            <polyline points="16 18 22 12 16 6" />
                                            <polyline points="8 6 2 12 8 18" />
                                        }
                                        @case ('merge') {
                                            <circle cx="6" cy="6" r="3" />
                                            <circle cx="6" cy="18" r="3" />
                                            <circle cx="18" cy="6" r="3" />
                                            <path d="M18 9a9 9 0 0 1-9 9" />
                                            <path d="M6 9v6" />
                                        }
                                        @case ('review') {
                                            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                                            <circle cx="12" cy="12" r="2.5" />
                                        }
                                        @case ('days') {
                                            <rect x="3" y="4" width="18" height="17" rx="2" />
                                            <line x1="3" y1="9" x2="21" y2="9" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                        }
                                        @case ('clock') {
                                            <circle cx="12" cy="12" r="9" />
                                            <polyline points="12 7 12 12 16 14" />
                                        }
                                    }
                                </svg>
                            </span>
                            <span class="k-l">{{ k.label }}</span>
                            @if (k.delta) {
                                <span class="pill" [class]="k.delta.cls">{{ k.delta.text }}</span>
                            }
                        </div>
                        <span class="k-v" [cpCountUp]="k.raw" [formatValue]="k.fmt"></span>
                        <span class="k-s">{{ k.sub }}</span>
                        @if (k.spark) {
                            <svg class="k-spark" viewBox="0 0 100 34" preserveAspectRatio="none" aria-hidden="true">
                                <polygon class="sp-area" [attr.points]="k.sparkArea" [attr.fill]="k.color" />
                                <polyline class="sp-line" pathLength="1" [attr.points]="k.spark" fill="none" [attr.stroke]="k.color" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" />
                            </svg>
                        }
                    </div>
                }
            </div>
        }
    `,
    styles: `
        :host {
            display: block;
        }
        .who {
            margin-bottom: 12px;
        }
        .eyebrow {
            font: 700 10px var(--font);
            letter-spacing: 0.08em;
            color: var(--muted);
            margin: 0 0 3px;
        }
        .who h2 {
            font: 800 24px var(--font-d);
            margin: 0;
            color: var(--ink);
        }
        .sub {
            font-size: 12.5px;
            color: var(--muted);
            margin: 4px 0 0;
        }
        .kpis {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 12px;
        }
        .kpi {
            position: relative;
            isolation: isolate;
            overflow: hidden;
            min-height: 104px;
            background: var(--glass, var(--surface));
            -webkit-backdrop-filter: blur(calc(var(--blur, 20px) * 0.8)) saturate(150%);
            backdrop-filter: blur(calc(var(--blur, 20px) * 0.8)) saturate(150%);
            border: 1px solid var(--glass-brd, var(--line));
            border-left: 3px solid var(--kc, var(--acc));
            border-radius: var(--radius, 14px);
            padding: 14px 16px 12px;
            display: flex;
            flex-direction: column;
            gap: 3px;
            transition:
                transform 0.16s ease,
                box-shadow 0.16s ease,
                border-color 0.16s ease;
        }
        .kpi:hover {
            transform: translateY(-4px);
            border-color: color-mix(in srgb, var(--kc, var(--acc)) 50%, transparent);
            box-shadow:
                var(--sh-pop, 0 26px 64px rgba(0, 6, 12, 0.6)),
                0 0 28px color-mix(in srgb, var(--kc, var(--acc)) 24%, transparent);
        }
        @media (prefers-reduced-motion: no-preference) {
            .kpi {
                animation: kpi-pop 0.4s cubic-bezier(0.22, 1, 0.36, 1) backwards;
                animation-delay: calc(var(--i, 0) * 0.04s);
            }
            @keyframes kpi-pop {
                from {
                    transform: scale(0.96) translateY(6px);
                }
            }
        }
        .k-top {
            display: flex;
            align-items: center;
            gap: 9px;
            margin-bottom: 3px;
        }
        .k-ic {
            width: 26px;
            height: 26px;
            flex: none;
            display: grid;
            place-items: center;
            border-radius: 8px;
            color: var(--kc, var(--acc));
            background: color-mix(in srgb, var(--kc, var(--acc)) 15%, transparent);
            box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--kc, var(--acc)) 34%, transparent);
        }
        .k-l {
            flex: 1;
            font: 700 10.5px var(--font);
            letter-spacing: 0.04em;
            color: var(--muted);
        }
        .k-v {
            font: 800 25px/1 var(--font-d);
            letter-spacing: -0.01em;
            color: var(--ink);
            font-variant-numeric: tabular-nums;
        }
        .k-s {
            font-size: 11px;
            color: var(--muted);
            margin-top: 1px;
        }
        .k-spark {
            display: block;
            width: calc(100% + 32px);
            height: 30px;
            margin: auto -16px -12px;
            opacity: 0.9;
        }
        .sp-area {
            fill-opacity: 0.18;
        }
        .sp-line {
            opacity: 0.95;
        }
        .pill {
            font: 700 10.5px var(--mono);
            font-variant-numeric: tabular-nums;
            border-radius: 999px;
            padding: 2px 7px;
            white-space: nowrap;
            flex: none;
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
    `,
})
export class KpisComponent {
    private readonly analytics = inject(AnalyticsStore);
    private readonly filters = inject(FiltersStore);

    protected readonly name = computed<string>(() => {
        return this.analytics.personName(this.filters.personId());
    });

    // Re-key the tiles on any view change (person, period, timeline granularity, …)
    // so the pop + sparkline-draw entrance animations replay, not only on load.
    protected readonly renderKey = this.filters.viewKey;

    protected readonly subline = computed<string>(() => {
        const c = this.analytics.selectedCell();
        if (!c) {
            return 'No activity in this view.';
        }
        const span = c.range[0] ? `active ${c.range[0]} → ${c.range[1]}` : '';
        return `${format(c.commits)} authored commits · ${c.days} active days · ${span}`;
    });

    protected readonly cards = computed<KpiCard[]>(() => {
        const c = this.analytics.selectedCell();
        if (!c) {
            return [];
        }
        const catTot =
            Object.values(c.categories).reduce((x, y) => {
                return x + y;
            }, 0) || 1;
        const specs: KpiSpec[] = [
            { label: 'Commits', raw: c.commits, fmt: format, sub: `${formatCompact(c.additions + c.deletions)} lines`, color: 'var(--acc)', icon: 'commits', idx: 0 },
            { label: 'Code Lines', raw: c.categories['code'] || 0, fmt: formatCompact, sub: `${percent(c.categories['code'] || 0, catTot).toFixed(0)}% of changes`, color: 'var(--acc)', icon: 'code', idx: 2 },
            { label: 'MRs Merged', raw: c.mergeRequests.merged, fmt: format, sub: `${c.mergeRequests.rate ?? '—'}% merge rate`, color: 'var(--acc)', icon: 'merge', idx: 4 },
            { label: 'Reviews', raw: c.mergeRequests.reviewed, fmt: format, sub: 'for others', color: 'var(--acc)', icon: 'review', idx: -1 },
            { label: 'Active Days', raw: c.days, fmt: format, sub: `${(c.days ? c.commits / c.days : 0).toFixed(1)} commits/day`, color: 'var(--acc)', icon: 'days', idx: -1 },
            { label: 'Median Merge', raw: c.mergeRequests.timeToMerge ?? 0, fmt: formatDuration, sub: 'time to merge', color: 'var(--acc)', icon: 'clock', idx: -1 },
        ];
        return specs.map((s) => {
            const series = s.idx >= 0 ? this.seriesFor(c, s.idx) : undefined;
            return {
                label: s.label,
                raw: s.raw,
                fmt: s.fmt,
                sub: s.sub,
                color: s.color,
                icon: s.icon,
                spark: series ? series.line : '',
                sparkArea: series ? series.area : '',
                delta: series?.delta,
            };
        });
    });

    private seriesFor(c: Cell, idx: number): { line: string; area: string; delta?: Delta } | undefined {
        const keys = c.series.keys;
        if (keys.length < 2) {
            return;
        }
        const vals = keys.map((k) => {
            return c.series.data[k][idx] || 0;
        });
        const geometry = this.sparkGeometry(vals);
        return { line: geometry.line, area: geometry.area, delta: this.deltaOf(vals) };
    }

    private sparkGeometry(vals: number[]): { line: string; area: string } {
        const w = 100;
        const h = 34;
        const pad = 4;
        const min = Math.min(...vals);
        const max = Math.max(...vals);
        const range = max - min || 1;
        const n = vals.length;
        const points = vals.map((v, i) => {
            const x = n > 1 ? (i / (n - 1)) * w : w / 2;
            const y = h - pad - ((v - min) / range) * (h - pad * 2);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        });
        const line = points.join(' ');
        return { line, area: `0,${h} ${line} ${w},${h}` };
    }

    private deltaOf(vals: number[]): Delta | undefined {
        const last = vals[vals.length - 1];
        const prev = vals[vals.length - 2];
        if (prev === 0) {
            return;
        }
        const d = ((last - prev) / Math.abs(prev)) * 100;
        const rounded = Math.abs(d) < 0.5 ? 0 : Math.round(d);
        if (rounded > 0) {
            return { text: `▲ ${rounded}%`, cls: 'up' };
        }
        if (rounded < 0) {
            return { text: `▼ ${Math.abs(rounded)}%`, cls: 'dn' };
        }
        return { text: '— 0%', cls: 'flat' };
    }
}
