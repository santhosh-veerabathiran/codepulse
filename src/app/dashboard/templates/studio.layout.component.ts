import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FilterBarComponent } from '../filter.bar.component';
import { SelectComponent } from '../select.component';
import { TemplateMenuComponent } from '../template.menu.component';
import { ThemeMenuComponent } from '../theme.menu.component';
import { TemplateLayoutBase } from './layout.base';

@Component({
    selector: 'cp-studio-layout',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgComponentOutlet, FilterBarComponent, ThemeMenuComponent, TemplateMenuComponent, SelectComponent],
    template: `
        <div class="studio-shell">
            <div class="glow"></div>
            <header class="bar">
                <div class="brand">
                    <span class="mk">C</span>
                    <span>CodePulse</span>
                </div>
                <nav class="pills">
                    @for (s of sections(); track s.id) {
                        <button type="button" [class.active]="active() === s.id" (click)="jump(s.id)">{{ s.label }}</button>
                    }
                </nav>
                <div class="tools">
                    <div class="who">
                        <cp-select icon="user" [options]="contribOpts()" [value]="personValue()" (picked)="pick($event)" />
                        <button type="button" class="stp" (click)="step(-1)" aria-label="Previous">‹</button>
                        <button type="button" class="stp" (click)="step(1)" aria-label="Next">›</button>
                    </div>
                    <cp-template-menu />
                    <cp-theme-menu />
                    <button type="button" class="gear" (click)="openSettings()" aria-label="Settings">⚙</button>
                </div>
            </header>

            <div class="content">
                <cp-filter-bar />
                @for (s of sections(); track s.id) {
                    <section [id]="s.id" data-sec><ng-container *ngComponentOutlet="s.component" /></section>
                }
            </div>
        </div>
    `,
    styles: `
        :host {
            display: block;
            min-height: 100vh;
        }
        .studio-shell {
            position: relative;
            z-index: 1;
            min-height: 100vh;
        }
        .glow {
            position: fixed;
            inset: 0;
            z-index: -1;
            pointer-events: none;
            background:
                radial-gradient(50% 40% at 15% 8%, color-mix(in srgb, var(--s6) 26%, transparent), transparent 70%), radial-gradient(46% 42% at 88% 4%, color-mix(in srgb, var(--acc) 24%, transparent), transparent 72%),
                radial-gradient(60% 50% at 60% 100%, color-mix(in srgb, var(--s2) 18%, transparent), transparent 76%);
            opacity: 0.9;
            filter: saturate(120%);
        }
        .bar {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 16px 26px;
            position: sticky;
            top: 12px;
            z-index: 30;
            margin: 12px 20px 0;
            border-radius: 999px;
            background: color-mix(in srgb, var(--surface) 66%, transparent);
            -webkit-backdrop-filter: blur(18px) saturate(150%);
            backdrop-filter: blur(18px) saturate(150%);
            border: 1px solid color-mix(in srgb, var(--acc) 14%, var(--glass-brd, var(--line)));
            box-shadow: 0 18px 50px -22px rgba(0, 0, 0, 0.6);
        }
        .brand {
            display: flex;
            align-items: center;
            gap: 10px;
            font: 800 15px var(--font-d, var(--font));
            letter-spacing: -0.02em;
            color: var(--ink);
            flex: none;
        }
        .brand .mk {
            width: 30px;
            height: 30px;
            border-radius: 10px;
            background: var(--grad, var(--acc));
            color: #fff;
            display: grid;
            place-items: center;
            font-size: 15px;
            font-weight: 800;
            box-shadow: 0 6px 18px -4px var(--acc);
        }
        .pills {
            display: flex;
            gap: 4px;
            overflow-x: auto;
            flex: 1;
            padding: 3px;
            scrollbar-width: none;
            mask-image: linear-gradient(90deg, transparent, #000 3%, #000 97%, transparent);
        }
        .pills::-webkit-scrollbar {
            display: none;
        }
        .pills button {
            font: 600 12.5px var(--font);
            color: var(--ink-2, var(--muted));
            padding: 8px 14px;
            border-radius: 999px;
            white-space: nowrap;
            transition:
                color 0.16s,
                background 0.16s,
                box-shadow 0.16s;
        }
        .pills button:hover {
            color: var(--ink);
            background: color-mix(in srgb, var(--ink) 7%, transparent);
        }
        .pills button.active {
            color: #fff;
            background: var(--grad, var(--acc));
            box-shadow: 0 8px 20px -6px var(--acc);
        }
        .tools {
            display: flex;
            gap: 8px;
            align-items: center;
            flex: none;
        }
        .who {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .stp {
            border: 1px solid var(--glass-brd, var(--line));
            background: color-mix(in srgb, var(--surface) 60%, transparent);
            color: var(--ink-2);
            border-radius: 999px;
            width: 32px;
            height: 32px;
            font-size: 14px;
        }
        .stp:hover {
            border-color: var(--acc);
            color: var(--acc);
        }
        .gear {
            border: 1px solid var(--glass-brd, var(--line));
            background: color-mix(in srgb, var(--surface) 60%, transparent);
            color: var(--ink-2, var(--muted));
            border-radius: 12px;
            width: 36px;
            height: 36px;
            font-size: 15px;
        }
        .gear:hover {
            border-color: var(--acc);
            color: var(--ink);
        }
        .content {
            max-width: 1320px;
            margin: 0 auto;
            padding: 22px 30px 70px;
            display: flex;
            flex-direction: column;
            gap: 22px;
        }
        .content section {
            scroll-margin-top: 96px;
        }
        @media (max-width: 900px) {
            .bar {
                flex-wrap: wrap;
                border-radius: 20px;
                margin: 12px 12px 0;
            }
            .pills {
                order: 3;
                width: 100%;
                flex: 1 1 100%;
            }
            .tools {
                flex: 1;
                flex-wrap: wrap;
                justify-content: flex-end;
            }
            .who {
                flex: 1 1 100%;
            }
            .who cp-select {
                flex: 1;
                min-width: 0;
            }
            .content {
                padding: 18px 14px 60px;
            }
        }
    `,
})
export class StudioLayoutComponent extends TemplateLayoutBase {}
