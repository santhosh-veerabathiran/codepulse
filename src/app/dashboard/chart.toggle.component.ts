import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ChartKind } from './types';

const TREND_MAP: Record<string, ChartKind> = { area: ChartKind.Area, line: ChartKind.Line, step: ChartKind.Step, bars: ChartKind.Bar, bar: ChartKind.Bar, dots: ChartKind.Dots };
const COMP_MAP: Record<string, ChartKind> = { donut: ChartKind.Donut, column: ChartKind.Column, hbar: ChartKind.Bar, bar: ChartKind.Bar };
const RANK_MAP: Record<string, ChartKind> = { lollipop: ChartKind.Dots, dot: ChartKind.Dots, dots: ChartKind.Dots, bar: ChartKind.Bar, column: ChartKind.Bar };

export const mapTrendKind = (name: string): ChartKind => {
    return TREND_MAP[name] ?? ChartKind.Area;
};

export const mapCompKind = (name: string): ChartKind => {
    return COMP_MAP[name] ?? ChartKind.Donut;
};

export const mapRankKind = (name: string): ChartKind => {
    return RANK_MAP[name] ?? ChartKind.Bar;
};

@Component({
    selector: 'cp-chart-toggle',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="seg">
            @for (k of kinds(); track k) {
                <button type="button" [class.on]="k === value()" (click)="picked.emit(k)" [attr.aria-label]="k" [title]="k">
                    <svg viewBox="0 0 14 12" width="15" height="13" aria-hidden="true">
                        @switch (k) {
                            @case (Kind.Line) {
                                <polyline points="1,10 4,5 7,7 10,2 13,4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" />
                            }
                            @case (Kind.Area) {
                                <polygon points="1,10 4,5 7,7 10,2 13,4 13,11 1,11" fill="currentColor" fill-opacity="0.35" stroke="currentColor" stroke-width="1.2" />
                            }
                            @case (Kind.Step) {
                                <polyline points="1,9 4,9 4,5 8,5 8,7 13,7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
                            }
                            @case (Kind.Bar) {
                                <g fill="currentColor">
                                    <rect x="1" y="6" width="2.6" height="5" />
                                    <rect x="5.7" y="3" width="2.6" height="8" />
                                    <rect x="10.4" y="7" width="2.6" height="4" />
                                </g>
                            }
                            @case (Kind.Column) {
                                <g fill="currentColor">
                                    <rect x="1" y="6" width="2.6" height="5" />
                                    <rect x="5.7" y="3" width="2.6" height="8" />
                                    <rect x="10.4" y="7" width="2.6" height="4" />
                                </g>
                            }
                            @case (Kind.Dots) {
                                <g fill="currentColor">
                                    <circle cx="2" cy="9" r="1.5" />
                                    <circle cx="7" cy="5" r="1.5" />
                                    <circle cx="12" cy="7" r="1.5" />
                                </g>
                            }
                            @case (Kind.Donut) {
                                <circle cx="7" cy="6" r="4" fill="none" stroke="currentColor" stroke-width="2.4" />
                            }
                        }
                    </svg>
                </button>
            }
        </div>
    `,
    styles: `
        .seg {
            display: inline-flex;
            background: var(--surface-2);
            border: 1px solid var(--line);
            border-radius: 9px;
            padding: 2px;
            gap: 1px;
        }
        button {
            display: grid;
            place-items: center;
            border: 0;
            background: none;
            color: var(--muted);
            width: 28px;
            height: 26px;
            border-radius: 6px;
            cursor: pointer;
            transition: 0.12s;
        }
        button:hover {
            color: var(--ink);
            background: var(--surface);
        }
        button.on {
            background: var(--acc);
            color: #04121c;
        }
    `,
})
export class ChartToggleComponent {
    protected readonly Kind = ChartKind;
    readonly kinds = input<ChartKind[]>([ChartKind.Area, ChartKind.Line, ChartKind.Bar]);
    readonly value = input<ChartKind>(ChartKind.Area);
    readonly picked = output<ChartKind>();
}
