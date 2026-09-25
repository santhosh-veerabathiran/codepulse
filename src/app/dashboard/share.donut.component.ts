import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DonutItem } from './types';

@Component({
    selector: 'cp-share-donut',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        @if (rows().length) {
            <div class="wrap">
                <div class="donut" [style.background]="gradient()">
                    <div class="hole">
                        <b>{{ rows().length }}</b>
                        <small>{{ unit() }}</small>
                    </div>
                </div>
                <div class="legend">
                    @for (r of rows(); track r.label) {
                        <div class="li" [title]="r.label + ' — ' + r.display + ' (' + r.pct + '%)'">
                            <span class="sw" [style.background]="r.color"></span>
                            <span class="ln">{{ r.label }}</span>
                            <span class="lv">{{ r.display }}</span>
                            <span class="lp">{{ r.pct }}%</span>
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
        .wrap {
            display: flex;
            align-items: center;
            gap: 26px;
            flex-wrap: wrap;
            padding: 6px 0;
        }
        .donut {
            width: 150px;
            height: 150px;
            border-radius: 50%;
            flex: none;
            display: grid;
            place-items: center;
            animation: ring-in 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) backwards;
        }
        @keyframes ring-in {
            from {
                transform: rotate(-60deg) scale(0.85);
                opacity: 0;
            }
        }
        .hole {
            width: 96px;
            height: 96px;
            border-radius: 50%;
            background: var(--surface, #0e2532);
            display: grid;
            place-items: center;
            text-align: center;
        }
        .hole b {
            font: 800 24px var(--font-d);
            color: var(--ink);
            line-height: 1;
        }
        .hole small {
            font: 600 10px var(--font);
            color: var(--muted);
            margin-top: 2px;
        }
        .legend {
            flex: 1;
            min-width: 200px;
            display: grid;
            gap: 6px;
        }
        .li {
            display: grid;
            grid-template-columns: 14px 1fr auto auto;
            align-items: center;
            gap: 10px;
            font: 600 12px var(--font);
        }
        .sw {
            width: 11px;
            height: 11px;
            border-radius: 3px;
        }
        .ln {
            color: var(--ink);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .lv {
            font-family: var(--mono);
            color: var(--ink-2, var(--muted));
            font-variant-numeric: tabular-nums;
        }
        .lp {
            font-family: var(--mono);
            color: var(--muted);
            font-variant-numeric: tabular-nums;
            min-width: 40px;
            text-align: right;
        }
    `,
})
export class ShareDonutComponent {
    readonly items = input<DonutItem[]>([]);
    readonly unit = input<string>('items');

    private readonly total = computed<number>(() => {
        return (
            this.items().reduce((sum, item) => {
                return sum + item.value;
            }, 0) || 1
        );
    });

    protected readonly rows = computed<(DonutItem & { pct: string })[]>(() => {
        const total = this.total();
        return this.items()
            .slice(0, 8)
            .map((item) => {
                return { ...item, pct: ((item.value / total) * 100).toFixed(1) };
            });
    });

    protected readonly gradient = computed<string>(() => {
        const total = this.total();
        const stops: string[] = [];
        let cursor = 0;
        for (const item of this.items().slice(0, 8)) {
            const start = (cursor / total) * 360;
            cursor += item.value;
            const end = (cursor / total) * 360;
            stops.push(`${item.color} ${start.toFixed(1)}deg ${end.toFixed(1)}deg`);
        }
        if (cursor < total) {
            stops.push(`var(--track, #1c2b36) ${((cursor / total) * 360).toFixed(1)}deg 360deg`);
        }
        return `conic-gradient(${stops.join(', ')})`;
    });
}
