import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ThemeStore } from '../core';
import { THEME_SWATCH } from './constants';
import { UiIconComponent } from './ui.icon.component';

@Component({
    selector: 'cp-theme-menu',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [UiIconComponent],
    template: `
        <button type="button" class="trigger" (click)="toggle()" aria-label="Theme">
            <cp-icon name="palette" [size]="17" />
        </button>
        @if (open()) {
            <div class="scrim" (click)="close()"></div>
            <div class="panel" role="menu">
                <p class="ph">Theme</p>
                @for (t of store.themes; track t.slug) {
                    <button type="button" class="opt" [class.on]="t.slug === store.current()" (click)="pick(t.slug)">
                        <span class="sw" [style.background]="swatch(t.slug)"></span>
                        <span class="nm">{{ t.name }}</span>
                        @if (t.slug === store.current()) {
                            <cp-icon class="tick" name="check" [size]="14" [stroke]="2.4" />
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
            display: grid;
            place-items: center;
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
            gap: 10px;
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
        .sw {
            width: 18px;
            height: 18px;
            border-radius: 6px;
            flex: none;
            box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18);
        }
        .nm {
            flex: 1;
        }
        .tick {
            color: var(--acc);
            flex: none;
        }
    `,
})
export class ThemeMenuComponent {
    protected readonly store = inject(ThemeStore);
    protected readonly open = signal<boolean>(false);

    protected swatch(slug: string): string {
        return THEME_SWATCH[slug] ?? 'var(--grad, var(--acc))';
    }

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
