import { ChangeDetectionStrategy, Component, computed, ElementRef, HostListener, inject, input, output, signal } from '@angular/core';
import { MONTHS, WEEKDAYS } from './constants';
import { DayCell, ViewMonth } from './types';

@Component({
    selector: 'cp-date-picker',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <button type="button" class="trigger" (click)="toggle($event)">
            <span class="glyph" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="17" rx="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                </svg>
            </span>
            <span class="label">{{ display() }}</span>
        </button>

        @if (open()) {
            <div class="panel">
                <div class="head">
                    <div class="navs">
                        <button type="button" class="nav" (click)="shiftYear(-1, $event)" aria-label="Previous year">«</button>
                        <button type="button" class="nav" (click)="shiftMonth(-1, $event)" aria-label="Previous month">‹</button>
                    </div>
                    <span class="title">{{ monthLabel() }}</span>
                    <div class="navs">
                        <button type="button" class="nav" (click)="shiftMonth(1, $event)" aria-label="Next month">›</button>
                        <button type="button" class="nav" (click)="shiftYear(1, $event)" aria-label="Next year">»</button>
                    </div>
                </div>
                <div class="weekdays">
                    @for (w of weekdays; track w) {
                        <span>{{ w }}</span>
                    }
                </div>
                <div class="grid">
                    @for (cell of cells(); track $index) {
                        @if (cell.blank) {
                            <span class="cell blank"></span>
                        } @else {
                            <button type="button" class="cell" [class.selected]="cell.selected" [class.today]="cell.today" [disabled]="cell.disabled" (click)="choose(cell, $event)">
                                {{ cell.day }}
                            </button>
                        }
                    }
                </div>
            </div>
        }
    `,
    styles: `
        :host {
            display: inline-block;
            position: relative;
        }
        .trigger {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: var(--surface-2);
            color: var(--ink);
            border: 1px solid var(--line);
            border-radius: 10px;
            padding: 9px 11px;
            font: 600 12.5px var(--font);
            cursor: pointer;
        }
        .trigger:hover {
            border-color: var(--acc);
        }
        .glyph {
            display: grid;
            place-items: center;
            color: var(--muted);
        }
        .label {
            white-space: nowrap;
        }
        .panel {
            position: absolute;
            top: calc(100% + 6px);
            left: 0;
            z-index: 200;
            width: 244px;
            background: var(--surface);
            border: 1px solid var(--line);
            border-radius: 12px;
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
            padding: 12px;
        }
        .head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 10px;
        }
        .navs {
            display: flex;
            gap: 4px;
        }
        .title {
            font: 700 13px var(--font);
            color: var(--ink);
        }
        .nav {
            width: 28px;
            height: 28px;
            border: 1px solid var(--line);
            border-radius: 8px;
            background: var(--surface-2);
            color: var(--ink-2);
            font-size: 16px;
            line-height: 1;
            cursor: pointer;
        }
        .nav:hover {
            border-color: var(--acc);
            color: var(--ink);
        }
        .weekdays {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 2px;
            margin-bottom: 4px;
        }
        .weekdays span {
            text-align: center;
            font: 700 10px var(--font);
            color: var(--muted);
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 2px;
        }
        .cell {
            height: 30px;
            display: grid;
            place-items: center;
            border: 0;
            background: none;
            color: var(--ink-2);
            border-radius: 8px;
            font: 600 12px var(--mono);
            cursor: pointer;
        }
        .cell:hover:not(:disabled):not(.blank) {
            background: var(--surface-2);
            color: var(--ink);
        }
        .cell.today {
            box-shadow: inset 0 0 0 1px var(--acc);
            color: var(--ink);
        }
        .cell.selected {
            background: var(--acc);
            color: #04121c;
        }
        .cell:disabled {
            color: var(--muted);
            opacity: 0.35;
            cursor: default;
        }
        .cell.blank {
            cursor: default;
        }
    `,
})
export class DatePickerComponent {
    private readonly host = inject(ElementRef<HTMLElement>);

    readonly value = input<string>('');
    readonly placeholder = input<string>('Pick a date');
    readonly min = input<string>('');
    readonly max = input<string>('');
    readonly picked = output<string>();

    protected readonly weekdays = WEEKDAYS;
    protected readonly open = signal<boolean>(false);
    protected readonly viewMonth = signal<ViewMonth>(this.initialMonth());

    protected readonly display = computed<string>(() => {
        const v = this.value();
        if (!v) {
            return this.placeholder();
        }
        const p = this.parse(v);
        return `${p.d} ${MONTHS[p.m]} ${p.y}`;
    });

    protected readonly monthLabel = computed<string>(() => {
        const vm = this.viewMonth();
        return `${MONTHS[vm.m]} ${vm.y}`;
    });

    protected readonly cells = computed<DayCell[]>(() => {
        const vm = this.viewMonth();
        const selected = this.value();
        const minV = this.min();
        const maxV = this.max();
        const todayIso = this.iso(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
        const lead = (new Date(vm.y, vm.m, 1).getDay() + 6) % 7;
        const total = new Date(vm.y, vm.m + 1, 0).getDate();
        const out: DayCell[] = [];
        for (let i = 0; i < lead; i++) {
            out.push({ iso: '', day: 0, selected: false, today: false, disabled: true, blank: true });
        }
        for (let d = 1; d <= total; d++) {
            const iso = this.iso(vm.y, vm.m, d);
            out.push({
                iso,
                day: d,
                selected: iso === selected,
                today: iso === todayIso,
                disabled: (!!minV && iso < minV) || (!!maxV && iso > maxV),
                blank: false,
            });
        }
        return out;
    });

    protected toggle(event: Event) {
        event.stopPropagation();
        if (!this.open()) {
            this.viewMonth.set(this.initialMonth());
        }
        this.open.update((o) => {
            return !o;
        });
    }

    protected shiftMonth(delta: number, event: Event) {
        event.stopPropagation();
        const vm = this.viewMonth();
        const next = new Date(vm.y, vm.m + delta, 1);
        this.viewMonth.set({ y: next.getFullYear(), m: next.getMonth() });
    }

    protected shiftYear(delta: number, event: Event) {
        event.stopPropagation();
        const vm = this.viewMonth();
        this.viewMonth.set({ y: vm.y + delta, m: vm.m });
    }

    protected choose(cell: DayCell, event: Event) {
        event.stopPropagation();
        if (cell.disabled || cell.blank) {
            return;
        }
        this.picked.emit(cell.iso);
        this.open.set(false);
    }

    @HostListener('document:click', ['$event'])
    protected onDocClick(event: Event) {
        if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
            this.open.set(false);
        }
    }

    @HostListener('document:keydown.escape')
    protected onEsc() {
        this.open.set(false);
    }

    private initialMonth(): ViewMonth {
        const v = this.value();
        if (v) {
            const p = this.parse(v);
            return { y: p.y, m: p.m };
        }
        const now = new Date();
        return { y: now.getFullYear(), m: now.getMonth() };
    }

    private parse(iso: string): { y: number; m: number; d: number } {
        const parts = iso.split('-');
        return { y: Number(parts[0]), m: Number(parts[1]) - 1, d: Number(parts[2]) };
    }

    private iso(y: number, m: number, d: number): string {
        return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
}
