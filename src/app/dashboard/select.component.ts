import { ChangeDetectionStrategy, Component, computed, ElementRef, HostListener, inject, input, output, signal } from '@angular/core';
import { OptionGroup, SelectOption } from './types';
import { UiIconComponent } from './ui.icon.component';

@Component({
    selector: 'cp-select',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [UiIconComponent],
    template: `
        @if (label()) {
            <span class="flabel">{{ label() }}</span>
        }
        <button type="button" class="trig" [class.open]="open()" (click)="toggle($event)">
            @if (icon()) {
                <cp-icon class="lead" [name]="icon()" [size]="15" />
            }
            <span class="tval">{{ triggerText() }}</span>
            <cp-icon class="chev" name="chevron" [size]="14" />
        </button>
        @if (open()) {
            <div class="panel" role="listbox">
                @if (showSearch()) {
                    <div class="searchwrap">
                        <cp-icon class="sicon" name="search" [size]="14" />
                        <input class="search" type="text" [value]="query()" (input)="query.set($any($event.target).value)" (click)="$event.stopPropagation()" placeholder="Search…" autofocus />
                    </div>
                }
                @for (g of grouped(); track g.name) {
                    @if (g.name) {
                        <div class="ghead">
                            <span>{{ g.name }}</span>
                            @if (multi()) {
                                <button type="button" class="gall" (click)="chooseGroup(g.options, $event)">{{ groupAllOn(g.options) ? 'Clear' : 'All' }}</button>
                            }
                        </div>
                    }
                    @if (!g.options.length) {
                        <p class="none">No matches</p>
                    }
                    @for (o of g.options; track o.value) {
                        <button type="button" class="opt" [class.on]="isOn(o.value)" (click)="choose(o.value, $event)">
                            @if (multi()) {
                                <span class="box" [class.checked]="isOn(o.value)">
                                    @if (isOn(o.value)) {
                                        <cp-icon name="check" [size]="11" [stroke]="2.6" />
                                    }
                                </span>
                            }
                            <span class="olbl">{{ o.label }}</span>
                            @if (o.hint) {
                                <span class="ohint">{{ o.hint }}</span>
                            }
                            @if (!multi() && isOn(o.value)) {
                                <cp-icon class="tick" name="check" [size]="14" [stroke]="2.4" />
                            }
                        </button>
                    }
                }
            </div>
        }
    `,
    styles: `
        :host {
            display: flex;
            flex-direction: column;
            gap: 6px;
            position: relative;
            min-width: 172px;
        }
        .flabel {
            font: 700 10px var(--font);
            letter-spacing: 0.05em;
            color: var(--muted);
        }
        .trig {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            width: 100%;
            background: var(--surface-2);
            color: var(--ink);
            border: 1px solid var(--line);
            border-radius: 10px;
            padding: 9px 12px;
            font: 600 12.5px var(--font);
            cursor: pointer;
            transition: 0.13s;
        }
        .trig:hover {
            border-color: var(--acc-line, var(--acc));
        }
        .trig.open {
            border-color: var(--acc);
            box-shadow: 0 0 0 3px var(--acc-soft);
        }
        .lead {
            color: var(--acc-ink, var(--acc));
            flex: none;
        }
        .tval {
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .chev {
            color: var(--muted);
            flex: none;
            transition: transform 0.16s ease;
        }
        .trig.open .chev {
            transform: rotate(180deg);
            color: var(--acc);
        }
        .searchwrap {
            position: relative;
            margin-bottom: 4px;
        }
        .searchwrap .sicon {
            position: absolute;
            left: 10px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--muted);
            pointer-events: none;
        }
        .panel {
            position: absolute;
            top: 100%;
            left: 0;
            margin-top: 6px;
            min-width: 100%;
            max-height: 320px;
            overflow-y: auto;
            background: var(--surface);
            border: 1px solid var(--line);
            border-radius: 12px;
            box-shadow: var(--sh-2, 0 12px 40px rgba(0, 0, 0, 0.45));
            padding: 5px;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            gap: 1px;
        }
        .search {
            width: 100%;
            box-sizing: border-box;
            background: var(--surface-2);
            color: var(--ink);
            border: 1px solid var(--line);
            border-radius: 8px;
            padding: 8px 10px 8px 30px;
            font: 500 12.5px var(--font);
            outline: none;
        }
        .search:focus {
            border-color: var(--acc);
        }
        .none {
            padding: 10px 11px;
            color: var(--muted);
            font-size: 12px;
            margin: 0;
        }
        .ghead {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 11px 4px;
            font: 700 9.5px var(--font);
            letter-spacing: 0.06em;
            color: var(--muted);
        }
        .gall {
            border: 0;
            background: none;
            color: var(--acc-ink, var(--acc));
            font: 700 10px var(--font);
            cursor: pointer;
            padding: 2px 4px;
        }
        .gall:hover {
            text-decoration: underline;
        }
        .opt {
            display: flex;
            align-items: center;
            gap: 9px;
            width: 100%;
            text-align: left;
            background: none;
            border: 0;
            color: var(--ink-2, var(--ink));
            padding: 9px 11px;
            border-radius: 8px;
            font: 600 12.5px var(--font);
            cursor: pointer;
            white-space: nowrap;
        }
        .opt:hover {
            background: var(--surface-2);
            color: var(--ink);
        }
        .opt.on {
            color: var(--acc-ink, var(--acc));
        }
        .olbl {
            flex: 1;
        }
        .ohint {
            font-size: 11px;
            color: var(--muted);
        }
        .tick {
            color: var(--acc);
            flex: none;
        }
        .box {
            width: 17px;
            height: 17px;
            flex: none;
            border-radius: 5px;
            border: 1px solid var(--line);
            display: grid;
            place-items: center;
            color: #04121c;
            background: var(--surface-2);
            transition:
                background 0.13s,
                border-color 0.13s;
        }
        .box.checked {
            background: var(--acc);
            border-color: var(--acc);
        }
    `,
})
export class SelectComponent {
    private readonly host = inject(ElementRef<HTMLElement>);

    readonly label = input<string>('');
    readonly icon = input<string>('');
    readonly options = input<SelectOption[]>([]);
    readonly value = input<string>('');
    readonly selected = input<string[]>([]);
    readonly multi = input<boolean>(false);
    readonly placeholder = input<string>('Select');
    readonly allLabel = input<string>('All');
    readonly searchable = input<boolean>(false);
    readonly picked = output<string>();
    readonly groupPicked = output<string[]>();

    protected readonly open = signal<boolean>(false);
    protected readonly query = signal<string>('');

    protected readonly showSearch = computed<boolean>(() => {
        return this.searchable() || this.options().length > 8;
    });

    private readonly filteredOptions = computed<SelectOption[]>(() => {
        const q = this.query().trim().toLowerCase();
        if (!q) {
            return this.options();
        }
        return this.options().filter((o) => {
            return o.label.toLowerCase().includes(q);
        });
    });

    protected readonly grouped = computed<OptionGroup[]>(() => {
        const groups: OptionGroup[] = [];
        const byName = new Map<string, OptionGroup>();
        for (const o of this.filteredOptions()) {
            const name = o.group ?? '';
            let g = byName.get(name);
            if (!g) {
                g = { name, options: [] };
                byName.set(name, g);
                groups.push(g);
            }
            g.options.push(o);
        }
        return groups;
    });

    protected readonly triggerText = computed<string>(() => {
        if (this.multi()) {
            const n = this.selected().length;
            return n ? `${n} selected` : this.allLabel();
        }
        const match = this.options().find((o) => {
            return o.value === this.value();
        });
        return match ? match.label : this.placeholder();
    });

    protected isOn(v: string): boolean {
        return this.multi() ? this.selected().includes(v) : this.value() === v;
    }

    protected groupAllOn(opts: SelectOption[]): boolean {
        return opts.every((o) => {
            return this.selected().includes(o.value);
        });
    }

    protected chooseGroup(opts: SelectOption[], event: Event) {
        event.stopPropagation();
        this.groupPicked.emit(
            opts.map((o) => {
                return o.value;
            }),
        );
    }

    protected toggle(event: Event) {
        event.stopPropagation();
        this.query.set('');
        this.open.update((o) => {
            return !o;
        });
    }

    protected choose(v: string, event: Event) {
        event.stopPropagation();
        this.picked.emit(v);
        if (!this.multi()) {
            this.open.set(false);
        }
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
}
