import { ChangeDetectionStrategy, Component, ElementRef, HostListener, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { AnalyticsStore, ALL, FactsStore, FiltersStore, NavStore } from '../core';
import { Command } from './types';

@Component({
    selector: 'cp-command-palette',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        @if (open()) {
            <div class="scrim" (click)="close()"></div>
            <div class="palette" role="dialog" aria-label="Command palette">
                <input #q class="q" type="text" placeholder="Type a command or search…" [value]="query()" (input)="setQuery($any($event.target).value)" />
                <div class="list">
                    @for (c of filtered(); track c.label; let i = $index) {
                        <button type="button" class="row" [class.active]="i === active()" (mouseenter)="active.set(i)" (click)="execute(c)">
                            <span class="lbl">{{ c.label }}</span>
                            <span class="hint">{{ c.hint }}</span>
                        </button>
                    } @empty {
                        <p class="none">No matching commands.</p>
                    }
                </div>
                <div class="foot">↑↓ navigate · ↵ select · esc close</div>
            </div>
        }
    `,
    styles: `
        :host {
            display: contents;
        }
        .scrim {
            position: fixed;
            inset: 0;
            z-index: 80;
            background: rgba(2, 8, 16, 0.5);
            backdrop-filter: blur(2px);
        }
        .palette {
            position: fixed;
            z-index: 81;
            top: 14vh;
            left: 50%;
            transform: translateX(-50%);
            width: min(560px, 92vw);
            background: var(--surface, #0e141b);
            border: 1px solid var(--line);
            border-radius: 14px;
            box-shadow: 0 24px 70px rgba(0, 6, 12, 0.6);
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        .q {
            border: 0;
            border-bottom: 1px solid var(--line);
            background: transparent;
            color: var(--ink);
            padding: 16px 18px;
            font: 500 14.5px var(--font);
            outline: none;
        }
        .q::placeholder {
            color: var(--muted);
        }
        .list {
            max-height: 46vh;
            overflow-y: auto;
            padding: 6px;
        }
        .row {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 10px 12px;
            border: 0;
            background: none;
            border-radius: 9px;
            cursor: pointer;
            text-align: left;
        }
        .row.active {
            background: var(--acc-soft, var(--surface-2));
        }
        .lbl {
            font: 600 13px var(--font);
            color: var(--ink);
        }
        .hint {
            font: 600 10px var(--mono);
            letter-spacing: 0.04em;
            color: var(--muted);
            border: 1px solid var(--line);
            border-radius: 20px;
            padding: 2px 8px;
        }
        .none {
            padding: 22px;
            text-align: center;
            color: var(--muted);
            font-size: 12.5px;
        }
        .foot {
            border-top: 1px solid var(--line);
            padding: 9px 14px;
            font: 500 11px var(--mono);
            color: var(--muted);
        }
    `,
})
export class CommandPaletteComponent {
    private readonly nav = inject(NavStore);
    private readonly filters = inject(FiltersStore);
    private readonly analytics = inject(AnalyticsStore);
    private readonly factsStore = inject(FactsStore);

    protected readonly open = signal<boolean>(false);
    protected readonly query = signal<string>('');
    protected readonly active = signal<number>(0);

    private readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('q');

    protected readonly commands = computed<Command[]>(() => {
        const list: Command[] = [
            {
                label: 'Go to Dashboard',
                hint: 'View',
                run: () => {
                    this.nav.requestScroll('sec-team');
                },
            },
            {
                label: 'Go to Compare',
                hint: 'View',
                run: () => {
                    this.nav.requestScroll('sec-compare');
                },
            },
            {
                label: 'Go to Ownership',
                hint: 'View',
                run: () => {
                    this.nav.requestScroll('sec-ownership');
                },
            },
            {
                label: 'Go to Merge Requests',
                hint: 'View',
                run: () => {
                    this.nav.requestScroll('sec-mr');
                },
            },
            {
                label: 'Open settings',
                hint: 'Action',
                run: () => {
                    this.nav.openSettings();
                },
            },
        ];
        if (this.filters.personId() !== ALL) {
            list.push({
                label: 'Show whole team',
                hint: 'Filter',
                run: () => {
                    this.filters.personId.set(ALL);
                },
            });
        }
        for (const r of this.analytics.ranked()) {
            list.push({
                label: `View ${r.name}`,
                hint: 'Contributor',
                run: () => {
                    this.filters.personId.set(r.id);
                },
            });
        }
        for (const repo of this.factsStore.facts()?.repos ?? []) {
            list.push({
                label: `Toggle repo: ${repo}`,
                hint: 'Repo',
                run: () => {
                    this.toggleRepo(repo);
                },
            });
        }
        if (this.filters.repoSel().length) {
            list.push({
                label: 'Clear repo filter',
                hint: 'Filter',
                run: () => {
                    this.filters.repoSel.set([]);
                },
            });
        }
        return list;
    });

    protected readonly filtered = computed<Command[]>(() => {
        const q = this.query().trim().toLowerCase();
        if (!q) {
            return this.commands();
        }
        return this.commands().filter((command) => {
            return command.label.toLowerCase().includes(q);
        });
    });

    constructor() {
        effect(() => {
            const len = this.filtered().length;
            if (untracked(this.active) >= len) {
                this.active.set(Math.max(0, len - 1));
            }
        });
        effect(() => {
            if (this.open()) {
                const ref = this.inputRef();
                setTimeout(() => {
                    ref?.nativeElement.focus();
                }, 0);
            }
        });
    }

    @HostListener('document:keydown', ['$event'])
    onKeydown(event: KeyboardEvent) {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
            event.preventDefault();
            this.toggle();
            return;
        }
        if (!this.open()) {
            return;
        }
        if (event.key === 'Escape') {
            event.preventDefault();
            this.close();
            return;
        }
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            this.move(1);
            return;
        }
        if (event.key === 'ArrowUp') {
            event.preventDefault();
            this.move(-1);
            return;
        }
        if (event.key === 'Enter') {
            event.preventDefault();
            this.execute(this.filtered()[this.active()]);
        }
    }

    protected setQuery(value: string) {
        this.query.set(value);
        this.active.set(0);
    }

    protected execute(command: Command | undefined) {
        if (!command) {
            return;
        }
        command.run();
        this.close();
    }

    protected close() {
        this.open.set(false);
    }

    private toggle() {
        if (this.open()) {
            this.close();
            return;
        }
        this.query.set('');
        this.active.set(0);
        this.open.set(true);
    }

    private move(delta: number) {
        const len = this.filtered().length;
        if (!len) {
            return;
        }
        this.active.set((this.active() + delta + len) % len);
    }

    private toggleRepo(repo: string) {
        const cur = this.filters.repoSel();
        if (cur.includes(repo)) {
            this.filters.repoSel.set(
                cur.filter((r) => {
                    return r !== repo;
                }),
            );
        } else {
            this.filters.repoSel.set([...cur, repo]);
        }
    }
}
