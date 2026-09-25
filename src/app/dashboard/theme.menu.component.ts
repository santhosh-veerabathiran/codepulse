import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ThemeStore } from '../core';
@Component({
    selector: 'cp-theme-menu',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <button type="button" class="trigger" (click)="toggle()" aria-label="Theme">🎨</button>
        @if (open()) {
            <div class="scrim" (click)="close()"></div>
            <div class="panel" role="menu">
                <p class="ph">Theme</p>
                @for (t of store.themes; track t.slug) {
                    <button type="button" class="opt" [class.on]="t.slug === store.current()" (click)="pick(t.slug)">
                        <span>{{ t.name }}</span>
                        @if (t.slug === store.current()) {
                            <span class="tick">✓</span>
                        }
                    </button>
                }
            </div>
        }
    `,
    styles: `
        :host {
            position: relative;
            display: inline-block;
        }
        .trigger {
            border: 1px solid var(--line);
            background: var(--surface-2);
            color: var(--ink-2, var(--muted));
            border-radius: 9px;
            width: 38px;
            height: 38px;
            font-size: 15px;
            cursor: pointer;
            flex: none;
        }
        .trigger:hover {
            border-color: var(--acc);
            color: var(--ink);
        }
        .scrim {
            position: fixed;
            inset: 0;
            z-index: 49;
        }
        .panel {
            position: absolute;
            top: 46px;
            right: 0;
            z-index: 50;
            min-width: 180px;
            background: var(--glass, var(--surface));
            -webkit-backdrop-filter: blur(14px);
            backdrop-filter: blur(14px);
            border: 1px solid var(--glass-brd, var(--line));
            border-radius: var(--radius, 12px);
            padding: 8px;
            box-shadow: 0 12px 44px rgba(0, 6, 12, 0.45);
        }
        .ph {
            font: 700 10px var(--font);
            letter-spacing: 0.06em;
            color: var(--muted);
            margin: 4px 8px 8px;
        }
        .opt {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            border: 0;
            background: none;
            color: var(--ink-2, var(--ink));
            border-radius: 8px;
            padding: 9px 10px;
            font: 600 12.5px var(--font);
            cursor: pointer;
            text-align: left;
        }
        .opt:hover {
            background: var(--surface-2);
            color: var(--ink);
        }
        .opt.on {
            background: var(--acc-soft);
            color: var(--acc-ink, var(--acc));
        }
        .tick {
            font-family: var(--mono);
            color: var(--acc);
        }
    `,
})
export class ThemeMenuComponent {
    protected readonly store = inject(ThemeStore);
    protected readonly open = signal<boolean>(false);

    protected toggle() {
        this.open.update((value) => {
            return !value;
        });
    }

    protected close() {
        this.open.set(false);
    }

    protected pick(slug: string) {
        void this.store.apply(slug);
        this.open.set(false);
    }
}
