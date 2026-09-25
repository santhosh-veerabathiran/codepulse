import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AnalyticsStore, Cell, COMPARE_GROUPS, FiltersStore, MetricKind, percent } from '../core';
import { COMPARE_COLORS, MAX_COMPARE_PEOPLE } from './constants';
import { ReplayDirective } from './replay.directive';
import { SelectComponent } from './select.component';
import { CmpBlock, CmpCell, CmpRow, ComparePerson, RadarModel, SelectOption, Standing } from './types';

@Component({
    selector: 'cp-compare',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [SelectComponent, ReplayDirective],
    template: `
        <div class="head">
            <div>
                <p class="eyebrow">Head to head</p>
                <h2>Compare contributors</h2>
                <p class="sub">Compare up to {{ max }} people side by side — every metric, within the current repo &amp; period.</p>
            </div>
            <button type="button" class="ghost" (click)="exportCsv()">Export CSV</button>
        </div>

        <div class="pick card">
            <div class="chips">
                @for (p of people(); track p.id) {
                    <span class="chip" [style.--pc]="p.color">
                        <span class="dot"></span>
                        {{ p.name }}
                        <button type="button" class="x" (click)="remove(p.id)" aria-label="Remove">✕</button>
                    </span>
                }
            </div>
            @if (people().length < max) {
                <cp-select class="add" placeholder="+ Add person" [searchable]="true" [options]="addOpts()" value="" (picked)="add($event)" />
            }
        </div>

        @if (people().length < 2) {
            <p class="empty card">Add at least two people to compare.</p>
        } @else {
            <div class="board" *cpReplay="replayKey()">
                @for (s of standings(); track s.id) {
                    <div class="scard" [class.lead]="s.id === leaderId()" [style.--pc]="s.color">
                        <div class="sc-name"><span class="dot"></span>{{ s.name }}</div>
                        <div class="sc-nums">
                            <div class="sc-g">
                                <b class="craft">{{ s.craft }}</b
                                ><span>Craft</span>
                            </div>
                            <div class="sc-g">
                                <b class="out">{{ s.output }}</b
                                ><span>Output</span>
                            </div>
                            <div class="sc-g">
                                <b>{{ s.total }}</b
                                ><span>Total wins</span>
                            </div>
                        </div>
                    </div>
                }
            </div>
            <p class="verdict">{{ verdict() }}</p>
            <p class="legend-note">
                <b class="craft">Craft</b> = wins on quality signals — tests, reviews, discipline, consistency, comment ratio, merge quality. <b class="out">Output</b> = wins on raw volume — commits, lines changed, MRs merged. They measure different
                things: high output isn't high craft, and vice-versa.
            </p>

            <div class="tbl" *cpReplay="replayKey()">
                <div class="hrow" [style.grid-template-columns]="cols()">
                    <span class="hl">Metric</span>
                    @for (p of people(); track p.id) {
                        <span class="hp" [style.color]="p.color">{{ p.name }}</span>
                    }
                </div>
                @for (b of blocks(); track b.name) {
                    <div class="grp" [class.craft]="b.craft">
                        {{ b.name }}<span class="grp-tag">{{ b.tag }}</span>
                    </div>
                    @for (r of b.rows; track r.label) {
                        <div class="mrow" [style.grid-template-columns]="cols()">
                            <span class="ml">{{ r.label }}</span>
                            @for (c of r.cells; track $index; let ci = $index) {
                                <div class="cell" [class.win]="c.win" [class.craft]="c.win && b.craft" [title]="people()[ci].name + ' — ' + r.label + ': ' + c.text + (c.win ? ' (leads)' : '')">
                                    <span class="cv">{{ c.mark }}{{ c.text }}</span>
                                    <div class="cbar"><i [style.width.%]="c.percent" [style.background]="c.color"></i></div>
                                </div>
                            }
                        </div>
                    }
                }
            </div>

            @if (radar(); as rd) {
                <div class="grp">Profile — each axis scaled to the leader</div>
                <div class="card viz" *cpReplay="replayKey()">
                    <svg [attr.viewBox]="'0 0 ' + rdW + ' ' + rdH" class="radar">
                        @for (g of rd.grid; track $index) {
                            <polygon [attr.points]="g" fill="none" stroke="var(--line)" stroke-width="1" />
                        }
                        @for (ax of rd.axes; track $index) {
                            <line [attr.x1]="ax.x1" [attr.y1]="ax.y1" [attr.x2]="ax.x2" [attr.y2]="ax.y2" stroke="var(--line)" stroke-width="1" />
                        }
                        @for (poly of rd.polys; track $index) {
                            <polygon [attr.points]="poly.points" [attr.fill]="poly.color" fill-opacity="0.14" [attr.stroke]="poly.color" stroke-width="2" />
                        }
                        @for (l of rd.labels; track $index) {
                            <text [attr.x]="l.x" [attr.y]="l.y" [attr.text-anchor]="l.anchor" class="rlbl">{{ l.text }}</text>
                        }
                    </svg>
                    <div class="rkey">
                        @for (p of people(); track p.id) {
                            <span><i [style.background]="p.color"></i>{{ p.name }}</span>
                        }
                    </div>
                </div>
            }
        }
    `,
    styles: `
        :host {
            display: block;
        }
        .head {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 14px;
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
        }
        .card {
            background: var(--glass, var(--surface));
            border: 1px solid var(--glass-brd, var(--line));
            border-radius: var(--radius, 14px);
        }
        .ghost {
            background: none;
            border: 1px solid var(--line);
            color: var(--ink-2, var(--ink));
            border-radius: 9px;
            padding: 8px 13px;
            font: 600 12px var(--font);
            cursor: pointer;
            white-space: nowrap;
        }
        .ghost:hover {
            border-color: var(--acc);
            color: var(--ink);
        }
        .pick {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 14px 16px;
            flex-wrap: wrap;
            /* No backdrop-filter: it would trap the add-person dropdown panel. */
            -webkit-backdrop-filter: none;
            backdrop-filter: none;
        }
        .chips {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }
        .chip {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: color-mix(in srgb, var(--pc) 12%, transparent);
            border: 1px solid color-mix(in srgb, var(--pc) 45%, var(--line));
            color: var(--ink);
            border-radius: 999px;
            padding: 6px 8px 6px 12px;
            font: 600 12.5px var(--font);
        }
        .chip .dot {
            width: 9px;
            height: 9px;
            border-radius: 50%;
            background: var(--pc);
        }
        .chip .x {
            border: 0;
            background: none;
            color: var(--muted);
            cursor: pointer;
            font-size: 11px;
            padding: 2px 4px;
            border-radius: 50%;
        }
        .chip .x:hover {
            color: var(--bad, #ef4444);
            background: var(--surface-2);
        }
        .additions {
            min-width: 190px;
        }
        .board {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 12px;
            margin-bottom: 10px;
        }
        .scard {
            background: var(--glass, var(--surface));
            border: 1px solid var(--glass-brd, var(--line));
            border-top: 3px solid var(--pc);
            border-radius: var(--radius, 14px);
            padding: 13px 15px;
        }
        .scard.lead {
            box-shadow: 0 0 0 1px var(--pc) inset;
        }
        .sc-name {
            display: flex;
            align-items: center;
            gap: 8px;
            font: 700 13.5px var(--font);
            color: var(--ink);
            margin-bottom: 10px;
        }
        .sc-name .dot {
            width: 9px;
            height: 9px;
            border-radius: 50%;
            background: var(--pc);
        }
        .sc-nums {
            display: flex;
            gap: 16px;
        }
        .sc-g {
            display: flex;
            flex-direction: column;
        }
        .sc-g b {
            font: 800 22px var(--font-d, var(--font));
            color: var(--ink);
            font-variant-numeric: tabular-nums;
        }
        .sc-g b.craft {
            color: var(--good, #34d399);
        }
        .sc-g b.out {
            color: var(--acc);
        }
        .sc-g span {
            font-size: 10.5px;
            color: var(--muted);
            letter-spacing: 0.04em;
        }
        .verdict {
            font: 700 14px var(--font-d, var(--font));
            color: var(--ink);
            margin: 4px 0 8px;
        }
        .legend-note {
            font-size: 12px;
            color: var(--muted);
            margin: 0 0 18px;
            max-width: 96ch;
            line-height: 1.5;
        }
        .legend-note b.craft {
            color: var(--good, #34d399);
        }
        .legend-note b.out {
            color: var(--acc);
        }
        .tbl {
            display: flex;
            flex-direction: column;
        }
        .hrow {
            display: grid;
            gap: 12px;
            padding: 4px 0 8px;
            border-bottom: 1px solid var(--line);
            position: sticky;
            top: 0;
        }
        .hl {
            font: 700 10px var(--font);
            letter-spacing: 0.05em;
            color: var(--muted);
        }
        .hp {
            font: 800 12px var(--font);
            text-align: right;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .grp {
            display: flex;
            align-items: center;
            gap: 8px;
            font: 700 11px var(--font);
            letter-spacing: 0.05em;
            color: var(--muted);
            margin: 16px 0 8px;
        }
        .grp-tag {
            font-size: 9px;
            padding: 2px 7px;
            border-radius: 20px;
            background: var(--surface-2);
            color: var(--muted);
        }
        .grp.craft .grp-tag {
            background: color-mix(in srgb, var(--good, #34d399) 18%, transparent);
            color: var(--good, #34d399);
        }
        .mrow {
            display: grid;
            gap: 12px;
            align-items: center;
            padding: 5px 0;
        }
        .ml {
            font: 600 12px var(--font);
            color: var(--ink);
        }
        .cell {
            display: flex;
            flex-direction: column;
            gap: 4px;
            padding: 4px 8px;
            border-radius: 8px;
        }
        .cell.win {
            background: var(--acc-soft);
        }
        .cell.win.craft {
            background: color-mix(in srgb, var(--good, #34d399) 15%, transparent);
        }
        .cv {
            font: 700 12px var(--mono);
            font-variant-numeric: tabular-nums;
            color: var(--ink-2, var(--ink));
            text-align: right;
        }
        .cell.win .cv {
            color: var(--acc);
        }
        .cell.win.craft .cv {
            color: var(--good, #34d399);
        }
        .cbar {
            height: 5px;
            border-radius: 3px;
            background: var(--surface-2);
            overflow: hidden;
        }
        .cbar i {
            display: block;
            height: 100%;
            border-radius: 3px;
            transform-origin: left center;
        }
        @media (prefers-reduced-motion: no-preference) {
            .cbar i {
                animation: cmp-grow 0.55s cubic-bezier(0.2, 0.7, 0.2, 1) backwards;
            }
            @keyframes cmp-grow {
                from {
                    transform: scaleX(0);
                }
            }
            .scard,
            .mrow,
            .viz {
                animation: cmp-rise 0.45s cubic-bezier(0.2, 0.7, 0.2, 1) backwards;
            }
            @keyframes cmp-rise {
                from {
                    opacity: 0;
                    transform: translateY(8px);
                }
            }
        }
        .empty {
            padding: 40px;
            text-align: center;
            color: var(--muted);
            margin-top: 14px;
        }
        .viz {
            padding: 16px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
        }
        .radar {
            width: 100%;
            max-width: 380px;
            height: auto;
        }
        .rlbl {
            fill: var(--muted);
            font: 700 9px var(--font);
        }
        .rkey {
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
            font-size: 12px;
            color: var(--ink-2, var(--ink));
        }
        .rkey i {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 3px;
            margin-right: 6px;
            vertical-align: middle;
        }
        @media (max-width: 800px) {
            .cv {
                font-size: 11px;
            }
        }
    `,
})
export class CompareComponent {
    private readonly analytics = inject(AnalyticsStore);
    private readonly filters = inject(FiltersStore);

    protected readonly max = MAX_COMPARE_PEOPLE;
    protected readonly rdW = 360;
    protected readonly rdH = 300;

    protected readonly replayKey = computed<string>(() => {
        return `${this.filters.viewKey()}:${this.people()
            .map((p) => {
                return p.id;
            })
            .join(',')}`;
    });
    protected readonly people = computed<ComparePerson[]>(() => {
        const out: ComparePerson[] = [];
        this.filters.compareIds().forEach((id, i) => {
            const cell = this.analytics.buildCell(id);
            if (cell) {
                out.push({ id, name: this.analytics.personName(id), color: COMPARE_COLORS[i % COMPARE_COLORS.length], cell });
            }
        });
        return out;
    });

    protected readonly cols = computed<string>(() => {
        return `minmax(110px, 170px) repeat(${Math.max(1, this.people().length)}, 1fr)`;
    });

    protected readonly addOpts = computed<SelectOption[]>(() => {
        const chosen = new Set(this.filters.compareIds());
        return this.analytics
            .ranked()
            .filter((r) => {
                return !chosen.has(r.id);
            })
            .map((r) => {
                return { value: String(r.id), label: r.name };
            });
    });

    protected readonly blocks = computed<CmpBlock[]>(() => {
        const ppl = this.people();
        if (ppl.length < 2) {
            return [];
        }
        return COMPARE_GROUPS.map((g) => {
            const craft = g.kind === MetricKind.Craft;
            const mark = craft ? '✓ ' : '▲ ';
            const rows: CmpRow[] = g.metrics.map((m) => {
                const vals = ppl.map((p) => {
                    return m.value(p.cell);
                });
                const best = m.lower ? Math.min(...vals) : Math.max(...vals);
                const distinct = new Set(vals).size > 1;
                const mx = Math.max(
                    1,
                    ...vals.map((v) => {
                        return Math.abs(v);
                    }),
                );
                const cells: CmpCell[] = ppl.map((p, i) => {
                    const win = distinct && vals[i] === best;
                    return {
                        text: m.format(vals[i]),
                        percent: Math.max(0, Math.min(100, (vals[i] / mx) * 100)),
                        color: p.color,
                        win,
                        mark: win ? mark : '',
                    };
                });
                return { label: m.label, cells };
            });
            return { name: g.name, craft, tag: craft ? 'quality' : 'volume', rows };
        });
    });

    protected readonly standings = computed<Standing[]>(() => {
        const ppl = this.people();
        const tally = ppl.map((p) => {
            return { id: p.id, name: p.name, color: p.color, craft: 0, output: 0, total: 0 };
        });
        for (const b of this.blocks()) {
            for (const r of b.rows) {
                r.cells.forEach((c, i) => {
                    if (c.win) {
                        if (b.craft) {
                            tally[i].craft++;
                        } else {
                            tally[i].output++;
                        }
                        tally[i].total++;
                    }
                });
            }
        }
        return tally;
    });

    protected readonly leaderId = computed<number>(() => {
        const s = [...this.standings()].sort((a, b) => {
            return b.total - a.total;
        });
        return s.length && (s.length < 2 || s[0].total > s[1].total) ? s[0].id : -1;
    });

    protected readonly radar = computed<RadarModel | undefined>(() => {
        const ppl = this.people();
        if (ppl.length < 2) {
            return undefined;
        }
        const catTot = (c: Cell): number => {
            return (
                Object.values(c.categories).reduce((x, y) => {
                    return x + y;
                }, 0) || 1
            );
        };
        const cpd = (c: Cell): number => {
            return c.days ? c.commits / c.days : 0;
        };
        const axes: { text: string; get: (c: Cell) => number }[] = [
            {
                text: 'Commits',
                get: (c) => {
                    return c.commits;
                },
            },
            {
                text: 'Lines',
                get: (c) => {
                    return c.additions + c.deletions;
                },
            },
            {
                text: 'Code %',
                get: (c) => {
                    return percent(c.categories['code'] || 0, catTot(c));
                },
            },
            {
                text: 'Comments %',
                get: (c) => {
                    return percent(c.commentAdd, c.commentAdd + c.codeAdd);
                },
            },
            {
                text: 'MRs merged',
                get: (c) => {
                    return c.mergeRequests.merged;
                },
            },
            {
                text: 'Reviews',
                get: (c) => {
                    return c.mergeRequests.reviewed;
                },
            },
            {
                text: 'Active days',
                get: (c) => {
                    return c.days;
                },
            },
            { text: 'Cadence', get: cpd },
        ];
        const n = axes.length;
        const cx = this.rdW / 2;
        const cy = this.rdH / 2 + 4;
        const R = 100;
        const pt = (i: number, r: number): [number, number] => {
            const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n;
            return [cx + Math.cos(ang) * R * r, cy + Math.sin(ang) * R * r];
        };
        const maxes = axes.map((ax) => {
            return Math.max(
                1,
                ...ppl.map((p) => {
                    return ax.get(p.cell);
                }),
            );
        });
        const ring = (r: number): string => {
            return axes
                .map((_, i) => {
                    return pt(i, r)
                        .map((v) => {
                            return v.toFixed(1);
                        })
                        .join(',');
                })
                .join(' ');
        };
        return {
            grid: [0.25, 0.5, 0.75, 1].map((r) => {
                return ring(r);
            }),
            axes: axes.map((_, i) => {
                const [x2, y2] = pt(i, 1);
                return { x1: cx, y1: cy, x2, y2 };
            }),
            labels: axes.map((ax, i) => {
                const [x, y] = pt(i, 1.16);
                const anchor = Math.abs(x - cx) < 6 ? 'middle' : x > cx ? 'start' : 'end';
                return { x, y, text: ax.text, anchor };
            }),
            polys: ppl.map((p) => {
                return {
                    color: p.color,
                    points: axes
                        .map((ax, i) => {
                            return pt(i, ax.get(p.cell) / maxes[i])
                                .map((c) => {
                                    return c.toFixed(1);
                                })
                                .join(',');
                        })
                        .join(' '),
                };
            }),
        };
    });

    protected add(value: string) {
        const id = Number(value);
        if (!this.filters.compareIds().includes(id) && this.filters.compareIds().length < MAX_COMPARE_PEOPLE) {
            this.filters.compareIds.set([...this.filters.compareIds(), id]);
        }
    }

    protected remove(id: number) {
        this.filters.compareIds.set(
            this.filters.compareIds().filter((x) => {
                return x !== id;
            }),
        );
    }

    protected verdict(): string {
        const s = [...this.standings()].sort((a, b) => {
            return b.total - a.total;
        });
        if (s.length < 2) {
            return '';
        }
        if (s[0].total === s[1].total) {
            return 'A dead heat — leads are split across areas.';
        }
        return `${s[0].name} leads overall with ${s[0].total} metric wins.`;
    }

    protected exportCsv() {
        const ppl = this.people();
        if (ppl.length < 2) {
            return;
        }
        const esc = (s: string): string => {
            return `"${s.replace(/"/g, '""')}"`;
        };
        const names = ppl.map((p) => {
            return p.name;
        });
        const lines = [['Group', 'Metric', ...names].map(esc).join(',')];
        for (const b of this.blocks()) {
            for (const r of b.rows) {
                const cellTexts = r.cells.map((c) => {
                    return c.text;
                });
                lines.push([b.name, r.label, ...cellTexts].map(esc).join(','));
            }
        }
        const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `compare-${names.join('-vs-')}.csv`.replace(/\s+/g, '_');
        a.click();
        URL.revokeObjectURL(url);
    }
}
