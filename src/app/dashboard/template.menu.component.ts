import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TemplateStore, ThemeStore } from '../core';
import { TEMPLATE_ICON } from './constants';
import { UiIconComponent } from './ui.icon.component';

@Component({
    selector: 'cp-template-menu',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [UiIconComponent],
    template: `
        <button type="button" class="trigger" (click)="toggle()" aria-label="Layout">
            <cp-icon name="layout" [size]="17" />
        </button>
        @if (open()) {
            <div class="scrim" (click)="close()"></div>
            <div class="panel" role="menu">
                <p class="ph">Template</p>
                @for (t of store.templates; track t.slug) {
                    <button type="button" class="opt" [class.on]="t.slug === store.current()" (click)="pick(t.slug)">
                        <span class="tico"><cp-icon [name]="icon(t.slug)" [size]="17" /></span>
                        <span class="lbl">
                            <b>{{ t.name }}</b>
                            <small>{{ t.tagline }}</small>
                        </span>
                        @if (t.slug === store.current()) {
                            <cp-icon class="tick" name="check" [size]="15" [stroke]="2.4" />
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
            min-width: 232px;
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
            gap: 11px;
            width: 100%;
            border: 0;
            background: none;
            color: var(--ink-2, var(--ink));
            border-radius: 8px;
            padding: 9px 10px;
            cursor: pointer;
            text-align: left;
        }
        .opt:hover {
            background: var(--surface-2);
        }
        .opt.on {
            background: var(--acc-soft);
        }
        .tico {
            width: 30px;
            height: 30px;
            flex: none;
            display: grid;
            place-items: center;
            border-radius: 8px;
            color: var(--ink-2);
            background: var(--surface-2);
            box-shadow: inset 0 0 0 1px var(--line);
        }
        .opt.on .tico {
            color: var(--acc-ink, var(--acc));
            background: var(--acc-soft);
            box-shadow: inset 0 0 0 1px var(--acc-line, var(--acc));
        }
        .lbl {
            display: flex;
            flex-direction: column;
            gap: 2px;
            flex: 1;
        }
        .lbl b {
            font: 700 12.5px var(--font);
            color: var(--ink);
        }
        .lbl small {
            font: 500 10.5px var(--font);
            color: var(--muted);
        }
        .opt.on .lbl b {
            color: var(--acc-ink, var(--acc));
        }
        .tick {
            color: var(--acc);
            flex: none;
        }
    `,
})
export class TemplateMenuComponent {
    protected readonly store = inject(TemplateStore);
    private readonly theme = inject(ThemeStore);
    private readonly router = inject(Router);
    protected readonly open = signal<boolean>(false);

    protected icon(slug: string): string {
        return TEMPLATE_ICON[slug] ?? 'layout';
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
        this.open.set(false);
        if (slug === this.store.current()) {
            return;
        }
        void this.theme.apply(this.store.defaultThemeFor(slug));
        void this.router.navigate(['/', slug], { queryParamsHandling: 'preserve', preserveFragment: true });
    }
}
