import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AnalyticsStore, FiltersStore, format, formatCompact, percent, ThemeStore } from '../core';
import { ChartToggleComponent, mapCompKind } from './chart.toggle.component';
import { CategoryItem, ChartKind, Composition, DistRow, SizeCard, Split } from './types';
import { QUALITY_CATEGORIES, SIZE_BUCKETS } from './constants';

@Component({
    selector: 'cp-quality',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ChartToggleComponent],
    template: `
        <div class="head">
            <p class="eyebrow">Code quality</p>
            <h2>{{ name() }} — what the code is made of</h2>
            <p class="sub">Line composition by category and typical commit size in this view.</p>
        </div>

        @if (!cell()) {
            <p class="empty card">No commits in this view.</p>
        } @else {
            <div class="split-grid">
                <div class="card block">
                    <div class="bhead">
                        <p class="bh">Composition</p>
                        <cp-chart-toggle [kinds]="compKinds" [value]="compKind()" (picked)="setCompKind($event)" />
                    </div>
                    @if (compKind() === Kind.Donut) {
                        <div class="comp">
                            <div class="donut" [style.background]="composition().gradient">
                                <div class="hole">
                                    <b>{{ composition().total }}</b>
                                    <small>lines</small>
                                </div>
                            </div>
                            <div class="legend-list">
                                @for (l of categories(); track l.key) {
                                    <div class="li">
                                        <span class="sw" [style.background]="l.color"></span>
                                        <span class="ln">{{ l.label }}</span>
                                        <span class="lv">{{ l.lines }}</span>
                                        <span class="lp">{{ l.pctText }}</span>
                                    </div>
                                }
                            </div>
                        </div>
                    } @else if (compKind() === Kind.Bar) {
                        <div class="cbars">
                            @for (l of categories(); track l.key) {
                                <div class="cbar-row">
                                    <span class="cbar-l">{{ l.label }}</span>
                                    <div class="cbar-t"><i [style.width.%]="l.percent" [style.background]="l.color"></i></div>
                                    <span class="cbar-v">{{ l.lines }} · {{ l.pctText }}</span>
                                </div>
                            }
                        </div>
                    } @else {
                        <div class="ccols">
                            @for (l of categories(); track l.key) {
                                <div class="ccol">
                                    <div class="ccol-track">
                                        <span class="ccol-v">{{ l.pctText }}</span>
                                        <div class="ccol-bar" [style.height.%]="l.colH" [style.background]="l.color"></div>
                                    </div>
                                    <span class="ccol-l">{{ l.label }}</span>
                                </div>
                            }
                        </div>
                    }
                </div>

                <div class="card block">
                    <p class="bh">Code vs comments</p>
                    <div class="segbar tall">
                        <div class="seg" [style.width.%]="split().codeW" style="background: var(--s1)" [title]="'Code: ' + split().codeText"></div>
                        <div class="seg" [style.width.%]="split().cmtW" style="background: var(--s3)" [title]="'Comments: ' + split().cmtText"></div>
                    </div>
                    <div class="legend">
                        <span><i style="background: var(--s1)"></i>Code {{ split().codeText }}</span>
                        <span><i style="background: var(--s3)"></i>Comments {{ split().cmtText }}</span>
                    </div>
                    <p class="cap">Comment lines are <b>{{ split().ratio }}</b> of the code+comment total they wrote.</p>
                </div>
            </div>

            <div class="kpis">
                @for (s of sizeCards(); track s.label) {
                    <div class="kpi">
                        <span class="k-l">{{ s.label }}</span>
                        <span class="k-v">{{ s.value }}</span>
                        <span class="k-s">{{ s.note }}</span>
                    </div>
                }
            </div>

            <div class="card block">
                <p class="bh">Commit-size distribution</p>
                <div class="dist">
                    @for (d of dist(); track d.label) {
                        <div class="dr">
                            <span class="dl">{{ d.label }}</span>
                            <div class="dt"><i [style.width.%]="d.w"></i></div>
                            <span class="dv">{{ d.count }}</span>
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
        .bhead {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 14px;
        }
        .bhead .bh {
            margin: 0;
        }
        .cbars {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .cbar-row {
            display: grid;
            grid-template-columns: 78px 1fr auto;
            align-items: center;
            gap: 12px;
            font-size: 12.5px;
        }
        .cbar-l {
            color: var(--ink-2, var(--ink));
        }
        .cbar-t {
            height: 10px;
            border-radius: 5px;
            background: var(--surface-2);
            overflow: hidden;
        }
        .cbar-t i {
            display: block;
            height: 100%;
            border-radius: 5px;
        }
        .cbar-v {
            font: 600 11.5px var(--mono);
            color: var(--muted);
            font-variant-numeric: tabular-nums;
            white-space: nowrap;
        }
        .ccols {
            display: flex;
            align-items: flex-end;
            gap: 12px;
            height: 150px;
            padding-top: 6px;
        }
        .ccol {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 7px;
            height: 100%;
        }
        .ccol-track {
            flex: 1;
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-end;
            gap: 5px;
        }
        .ccol-v {
            font: 600 10.5px var(--mono);
            color: var(--muted);
            font-variant-numeric: tabular-nums;
        }
        .ccol-bar {
            width: 100%;
            max-width: 40px;
            border-radius: 6px 6px 2px 2px;
            min-height: 2px;
        }
        .ccol-l {
            font-size: 10.5px;
            color: var(--muted);
            text-align: center;
        }
        .split-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }
        .comp {
            display: flex;
            align-items: center;
            gap: 20px;
            flex-wrap: wrap;
        }
        .donut {
            width: 130px;
            height: 130px;
            border-radius: 50%;
            flex: none;
            display: grid;
            place-items: center;
        }
        .hole {
            width: 84px;
            height: 84px;
            border-radius: 50%;
            background: var(--surface);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 2px;
        }
        .hole b {
            font: 800 17px var(--font-d);
            color: var(--ink);
        }
        .hole small {
            font-size: 9.5px;
            letter-spacing: 0.08em;
            color: var(--muted);
        }
        .legend-list {
            flex: 1;
            min-width: 180px;
            display: flex;
            flex-direction: column;
            gap: 7px;
        }
        .li {
            display: grid;
            grid-template-columns: 14px 1fr auto auto;
            align-items: center;
            gap: 10px;
            font-size: 12.5px;
        }
        .sw {
            width: 11px;
            height: 11px;
            border-radius: 3px;
        }
        .ln {
            color: var(--ink-2, var(--ink));
        }
        .lv {
            font: 600 12px var(--mono);
            color: var(--ink);
            font-variant-numeric: tabular-nums;
        }
        .lp {
            font: 600 11.5px var(--mono);
            color: var(--muted);
            min-width: 42px;
            text-align: right;
        }
        .segbar {
            display: flex;
            height: 15px;
            border-radius: 5px;
            overflow: hidden;
            gap: 2px;
            background: var(--surface-2);
        }
        .segbar.tall {
            height: 20px;
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
        .cap {
            font-size: 12px;
            color: var(--muted);
            margin: 12px 0 0;
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
            font: 800 24px/1 var(--font-d);
            color: var(--ink);
            font-variant-numeric: tabular-nums;
        }
        .k-s {
            font-size: 11.5px;
            color: var(--muted);
        }
        .dist {
            display: flex;
            flex-direction: column;
            gap: 9px;
        }
        .dr {
            display: grid;
            grid-template-columns: 70px 1fr 60px;
            align-items: center;
            gap: 12px;
            font-size: 12.5px;
        }
        .dl {
            font: 600 12px var(--mono);
            color: var(--ink-2, var(--ink));
        }
        .dt {
            height: 9px;
            border-radius: 4px;
            background: var(--surface-2);
            overflow: hidden;
        }
        .dt i {
            display: block;
            height: 100%;
            border-radius: 4px;
            background: var(--grad, var(--acc));
        }
        .dv {
            text-align: right;
            font: 600 12px var(--mono);
            color: var(--ink);
            font-variant-numeric: tabular-nums;
        }
        .tbl-wrap {
            overflow-x: auto;
        }
        table.big {
            width: 100%;
            border-collapse: collapse;
            font-size: 12.5px;
        }
        .big th {
            text-align: left;
            font: 700 10px var(--font);
            letter-spacing: 0.05em;
            color: var(--muted);
            padding: 0 12px 10px 0;
            border-bottom: 1px solid var(--line);
            white-space: nowrap;
        }
        .big th.num,
        .big td.num {
            text-align: right;
        }
        .big td {
            padding: 10px 12px 10px 0;
            border-bottom: 1px solid var(--line);
            color: var(--ink);
            vertical-align: top;
        }
        .big td.num {
            font: 600 12.5px var(--mono);
            font-variant-numeric: tabular-nums;
            white-space: nowrap;
        }
        .dt-c {
            color: var(--ink-2, var(--muted));
            white-space: nowrap;
        }
        .kind {
            font: 700 9.5px var(--font);
            letter-spacing: 0.03em;
            color: var(--good);
            border: 1px solid color-mix(in srgb, var(--good) 40%, transparent);
            border-radius: 20px;
            padding: 1px 7px;
            margin-right: 6px;
        }
        .scope {
            color: var(--muted);
            margin-right: 6px;
        }
        .repo-tag {
            font-size: 10.5px;
            color: var(--muted);
            background: var(--surface-2);
            border-radius: 5px;
            padding: 1px 6px;
            margin-left: 8px;
            white-space: nowrap;
        }
        .sha {
            font-size: 12px;
            color: var(--acc);
            text-decoration: none;
        }
        .sha:hover {
            text-decoration: underline;
        }
        .empty {
            padding: 40px;
            text-align: center;
            color: var(--muted);
        }
        .empty-row {
            text-align: center;
            color: var(--muted);
            padding: 18px;
        }
        @media (max-width: 720px) {
            .split-grid {
                grid-template-columns: 1fr;
            }
        }
    `,
})
export class QualityComponent {
    private readonly analytics = inject(AnalyticsStore);
    private readonly filters = inject(FiltersStore);
    private readonly theme = inject(ThemeStore);

    protected readonly cell = this.analytics.selectedCell;
    protected readonly name = computed<string>(() => {
        return this.analytics.personName(this.filters.personId());
    });
    protected readonly Kind = ChartKind;
    protected readonly compKinds: ChartKind[] = [ChartKind.Donut, ChartKind.Bar, ChartKind.Column];
    private readonly userCompKind = signal<ChartKind | undefined>(undefined);
    protected readonly compKind = computed<ChartKind>(() => {
        return this.userCompKind() ?? mapCompKind(this.theme.charts().composition);
    });

    protected setCompKind(k: ChartKind) {
        this.userCompKind.set(k);
    }

    protected readonly categories = computed<CategoryItem[]>(() => {
        const c = this.cell();
        if (!c) {
            return [];
        }
        const present = QUALITY_CATEGORIES.map((cat) => {
            return { cat, value: c.categories[cat.key] || 0 };
        }).filter((e) => {
            return e.value > 0;
        });
        const total =
            present.reduce((sum, e) => {
                return sum + e.value;
            }, 0) || 1;
        const maxValue = Math.max(
            1,
            ...present.map((e) => {
                return e.value;
            }),
        );
        return present.map((e) => {
            const share = percent(e.value, total);
            return {
                key: e.cat.key,
                label: e.cat.label,
                color: e.cat.color,
                value: e.value,
                lines: formatCompact(e.value),
                percent: share,
                pctText: `${share.toFixed(1)}%`,
                colH: (e.value / maxValue) * 100,
            };
        });
    });

    protected readonly composition = computed<Composition>(() => {
        const cats = this.categories();
        if (!cats.length) {
            return { gradient: 'var(--track) 0 100%', total: '0' };
        }
        const stops: string[] = [];
        let acc = 0;
        let total = 0;
        for (const cat of cats) {
            stops.push(`${cat.color} ${acc.toFixed(2)}% ${(acc + cat.percent).toFixed(2)}%`);
            acc += cat.percent;
            total += cat.value;
        }
        return {
            gradient: `conic-gradient(${stops.join(',')})`,
            total: formatCompact(total),
        };
    });

    protected readonly split = computed<Split>(() => {
        const c = this.cell();
        if (!c) {
            return { codeW: 0, cmtW: 0, codeText: '0', cmtText: '0', ratio: '0%' };
        }
        const code = c.codeAdd;
        const cmt = c.commentAdd;
        const total = code + cmt || 1;
        return {
            codeW: (code / total) * 100,
            cmtW: (cmt / total) * 100,
            codeText: formatCompact(code),
            cmtText: formatCompact(cmt),
            ratio: `${percent(cmt, code + cmt).toFixed(0)}%`,
        };
    });

    protected readonly sizeCards = computed<SizeCard[]>(() => {
        const c = this.cell();
        if (!c) {
            return [];
        }
        const s = c.sizes;
        return [
            { label: 'Median', value: `${format(s.median)} ln`, note: 'typical commit' },
            { label: 'Mean', value: `${format(Math.round(s.mean))} ln`, note: 'pulled by big commits' },
            { label: 'p75', value: `${format(s.p75)} ln`, note: '3 in 4 below' },
            { label: 'p90', value: `${format(s.p90)} ln`, note: 'top 10% start' },
        ];
    });

    protected readonly dist = computed<DistRow[]>(() => {
        const c = this.cell();
        if (!c) {
            return [];
        }
        const counts = SIZE_BUCKETS.map(() => {
            return 0;
        });
        for (const s of c.sizeList) {
            const idx = SIZE_BUCKETS.findIndex((b) => {
                return s <= b.max;
            });
            counts[idx >= 0 ? idx : SIZE_BUCKETS.length - 1]++;
        }
        const max = Math.max(1, ...counts);
        return SIZE_BUCKETS.map((b, i) => {
            return { label: b.label, count: counts[i], w: (counts[i] / max) * 100 };
        });
    });

}
