import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ChartTip } from './types';

@Component({
    selector: 'cp-chart-tip',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        @if (tip(); as t) {
            <div class="tip" [class.flip]="t.xPct > 60" [style.left.%]="t.xPct">
                <div class="t-title">{{ t.title }}</div>
                @for (r of t.rows; track r.label) {
                    <div class="t-row" [class.on]="r.active">
                        <span class="t-sw" [style.background]="r.color"></span>
                        <span class="t-l">{{ r.label }}</span>
                        <span class="t-v">{{ r.value }}</span>
                    </div>
                }
            </div>
        }
    `,
    styles: `
        :host {
            display: contents;
        }
        .tip {
            position: absolute;
            top: 8px;
            transform: translateX(10px);
            z-index: 5;
            pointer-events: none;
            min-width: 116px;
            background: var(--raise, var(--surface));
            border: 1px solid var(--glass-brd, var(--line));
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
            padding: 8px 10px;
        }
        .tip.flip {
            transform: translateX(calc(-100% - 10px));
        }
        .t-title {
            font: 700 11px var(--font);
            color: var(--ink);
            margin-bottom: 5px;
            font-variant-numeric: tabular-nums;
        }
        .t-row {
            display: flex;
            align-items: center;
            gap: 7px;
            font: 500 11.5px var(--font);
            color: var(--muted);
        }
        .t-row + .t-row {
            margin-top: 3px;
        }
        .t-row.on {
            color: var(--ink);
            font-weight: 700;
            padding-bottom: 5px;
            margin-bottom: 2px;
            border-bottom: 1px solid var(--line);
        }
        .t-row.on .t-sw {
            box-shadow: 0 0 0 2px var(--acc-soft);
        }
        .t-sw {
            width: 8px;
            height: 8px;
            border-radius: 2px;
            flex: none;
        }
        .t-l {
            flex: 1;
        }
        .t-v {
            font-weight: 700;
            color: var(--ink);
            font-variant-numeric: tabular-nums;
        }
    `,
})
export class ChartTipComponent {
    readonly tip = input<ChartTip | undefined>(undefined);
}
