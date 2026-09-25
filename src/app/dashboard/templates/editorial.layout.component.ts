import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FilterBarComponent } from '../filter.bar.component';
import { SelectComponent } from '../select.component';
import { TemplateMenuComponent } from '../template.menu.component';
import { ThemeMenuComponent } from '../theme.menu.component';
import { TemplateLayoutBase } from './layout.base';

@Component({
    selector: 'cp-editorial-layout',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgComponentOutlet, FilterBarComponent, ThemeMenuComponent, TemplateMenuComponent, SelectComponent],
    template: `
        <div class="ed">
            <header class="bar">
                <div class="brand"><span class="mk">C</span>CodePulse</div>
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

            <div class="hero">
                <p class="eye">Git Contribution Analytics</p>
                <h1>How this team<br />builds software.</h1>
                <p class="lede">{{ repoSub() }}</p>
                <div class="figs">
                    @for (g of grand(); track g.l) {
                        <div class="fig">
                            <b>{{ g.v }}</b>
                            <span>{{ g.l }}</span>
                        </div>
                    }
                </div>
            </div>

            <nav class="toc">
                @for (s of sections(); track s.id) {
                    <button type="button" [class.active]="active() === s.id" (click)="jump(s.id)">{{ s.label }}</button>
                }
            </nav>

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
        .ed {
            position: relative;
            z-index: 1;
        }
        .bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding: 20px 34px;
            max-width: 1120px;
            margin: 0 auto;
            flex-wrap: wrap;
        }
        .brand {
            display: flex;
            align-items: center;
            gap: 10px;
            font: 800 16px var(--font-d, var(--font));
            letter-spacing: -0.02em;
            color: var(--ink);
        }
        .brand .mk {
            width: 30px;
            height: 30px;
            border-radius: 9px;
            background: var(--grad, var(--acc));
            color: #fff;
            display: grid;
            place-items: center;
            font-size: 15px;
            font-weight: 800;
        }
        .tools {
            display: flex;
            gap: 8px;
            align-items: center;
        }
        .who {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .stp {
            border: 1px solid var(--line);
            background: var(--surface-2);
            color: var(--ink-2);
            border-radius: 8px;
            width: 32px;
            height: 32px;
            font-size: 14px;
        }
        .stp:hover {
            border-color: var(--acc);
            color: var(--acc);
        }
        .gear {
            border: 1px solid var(--line);
            background: var(--surface-2);
            color: var(--ink-2, var(--muted));
            border-radius: 9px;
            width: 36px;
            height: 36px;
            font-size: 15px;
        }
        .gear:hover {
            border-color: var(--acc);
            color: var(--ink);
        }
        .hero {
            max-width: 1120px;
            margin: 0 auto;
            padding: 30px 34px 26px;
        }
        .hero .eye {
            font: 700 13px var(--font);
            letter-spacing: 0.04em;
            color: var(--acc-ink, var(--acc));
            margin: 0 0 16px;
        }
        .hero h1 {
            font: 800 clamp(38px, 6vw, 76px) / 0.98 var(--font-d, var(--font));
            letter-spacing: -0.04em;
            color: var(--ink);
            margin: 0;
            text-wrap: balance;
        }
        .hero .lede {
            font: 400 16px/1.5 var(--font);
            color: var(--muted);
            margin: 18px 0 0;
            max-width: 54ch;
        }
        .figs {
            display: flex;
            flex-wrap: wrap;
            gap: 40px;
            margin-top: 34px;
            padding-top: 26px;
            border-top: 1px solid var(--line);
        }
        .fig b {
            display: block;
            font: 800 32px/1 var(--font-d, var(--font));
            letter-spacing: -0.03em;
            color: var(--ink);
            font-variant-numeric: tabular-nums;
        }
        .fig span {
            font: 600 12px var(--font);
            color: var(--muted);
            margin-top: 6px;
            display: block;
        }
        .toc {
            position: sticky;
            top: 0;
            z-index: 30;
            display: flex;
            gap: 4px;
            overflow-x: auto;
            padding: 12px 34px;
            max-width: 1120px;
            margin: 8px auto 0;
            scrollbar-width: none;
            -webkit-backdrop-filter: blur(10px);
            backdrop-filter: blur(10px);
            background: color-mix(in srgb, var(--app) 72%, transparent);
            border-bottom: 1px solid var(--line);
            mask-image: linear-gradient(90deg, transparent, #000 3%, #000 97%, transparent);
        }
        .toc::-webkit-scrollbar {
            display: none;
        }
        .toc button {
            font: 600 12.5px var(--font);
            color: var(--muted);
            padding: 7px 12px;
            border-radius: 999px;
            white-space: nowrap;
            transition:
                color 0.15s,
                background 0.15s;
        }
        .toc button:hover {
            color: var(--ink);
            background: var(--surface-2);
        }
        .toc button.active {
            color: var(--acc-ink, var(--acc));
            background: var(--acc-soft);
        }
        .content {
            max-width: 1120px;
            margin: 0 auto;
            padding: 26px 34px 80px;
            display: flex;
            flex-direction: column;
            gap: 28px;
        }
        .content section {
            scroll-margin-top: 64px;
        }
        @media (max-width: 720px) {
            .bar,
            .hero,
            .toc,
            .content {
                padding-left: 18px;
                padding-right: 18px;
            }
            .tools {
                flex: 1 1 100%;
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
            .figs {
                gap: 26px;
            }
        }
    `,
})
export class EditorialLayoutComponent extends TemplateLayoutBase {}
