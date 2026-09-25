import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FilterBarComponent } from '../filter.bar.component';
import { SectionIconComponent } from '../section.icon.component';
import { SelectComponent } from '../select.component';
import { TemplateMenuComponent } from '../template.menu.component';
import { ThemeMenuComponent } from '../theme.menu.component';
import { TemplateLayoutBase } from './layout.base';

@Component({
    selector: 'cp-console-layout',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgComponentOutlet, FilterBarComponent, ThemeMenuComponent, TemplateMenuComponent, SelectComponent, SectionIconComponent],
    template: `
        <div class="app">
            <aside class="rail">
                <div class="logo"><span class="mk">C</span>CodePulse</div>
                <cp-select icon="user" [options]="contribOpts()" [value]="personValue()" (picked)="pick($event)" />
                <nav class="nav">
                    @for (s of sections(); track s.id; let i = $index) {
                        <button type="button" [class.active]="active() === s.id" (click)="jump(s.id)" [style.--nc]="s.color">
                            <cp-sec-icon class="ic" [id]="s.id" [size]="17" />
                            {{ s.label }}
                        </button>
                    }
                </nav>
                <div class="rail-foot">
                    @for (g of grand(); track g.l) {
                        <div>
                            <span>{{ g.l }}</span
                            ><b>{{ g.v }}</b>
                        </div>
                    }
                </div>
            </aside>

            <main class="main">
                <header class="topbar">
                    <div class="brand">
                        <h1>Dashboard</h1>
                        <p class="sub">{{ repoSub() }}</p>
                    </div>
                    <div class="tools">
                        <cp-template-menu />
                        <cp-theme-menu />
                        <button type="button" class="gear" (click)="openSettings()" aria-label="Settings">⚙</button>
                    </div>
                </header>

                <div class="widgets">
                    @for (g of grand(); track g.l; let i = $index) {
                        <div class="widget" [attr.data-c]="i">
                            <span class="wk">{{ g.l }}</span>
                            <b class="wv">{{ g.v }}</b>
                        </div>
                    }
                </div>

                <div class="content">
                    <cp-filter-bar />
                    @for (s of sections(); track s.id) {
                        <section [id]="s.id" data-sec><ng-container *ngComponentOutlet="s.component" /></section>
                    }
                </div>
            </main>
        </div>
    `,
    styles: `
        :host {
            display: block;
            min-height: 100vh;
        }
        .app {
            display: flex;
            min-height: 100vh;
            position: relative;
            z-index: 1;
        }
        .rail {
            width: 244px;
            flex: none;
            background: var(--surface);
            border-right: 1px solid var(--line);
            padding: 18px 14px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            position: sticky;
            top: 0;
            height: 100vh;
            overflow-y: auto;
        }
        .logo {
            display: flex;
            align-items: center;
            gap: 10px;
            font: 800 16px var(--font-d, var(--font));
            letter-spacing: -0.02em;
            color: var(--ink);
            padding: 2px 6px 10px;
        }
        .logo .mk {
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
        .nav {
            display: flex;
            flex-direction: column;
            gap: 2px;
            margin-top: 6px;
        }
        .nav button {
            width: 100%;
            text-align: left;
            color: var(--ink-2, var(--muted));
            padding: 10px 12px;
            border-radius: 10px;
            font: 600 13px var(--font);
            display: flex;
            align-items: center;
            gap: 12px;
            transition:
                background 0.14s,
                color 0.14s;
        }
        .nav .ic {
            display: inline-flex;
            flex: none;
            color: var(--nc, var(--muted));
            opacity: 0.85;
        }
        .nav button:hover {
            background: var(--surface-2);
            color: var(--ink);
        }
        .nav button.active {
            background: var(--acc-soft);
            color: var(--acc-ink, var(--acc));
            font-weight: 700;
        }
        .nav button.active .ic {
            opacity: 1;
        }
        .rail-foot {
            margin-top: auto;
            padding-top: 14px;
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        .rail-foot > div {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            padding: 6px 8px;
            font: 600 11px var(--font);
            color: var(--muted);
        }
        .rail-foot b {
            color: var(--ink);
            font-size: 13px;
            font-weight: 800;
            font-variant-numeric: tabular-nums;
        }
        .main {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
        }
        .topbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding: 22px 30px 8px;
            flex-wrap: wrap;
        }
        .brand h1 {
            margin: 0;
            font: 800 24px/1.1 var(--font-d, var(--font));
            letter-spacing: -0.03em;
            color: var(--ink);
        }
        .sub {
            color: var(--muted);
            font: 600 12px var(--font);
            margin: 5px 0 0;
        }
        .tools {
            display: flex;
            gap: 10px;
            align-items: center;
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
        .widgets {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            padding: 14px 30px 0;
        }
        .widget {
            border-radius: 16px;
            padding: 18px;
            color: #fff;
            position: relative;
            overflow: hidden;
            min-height: 96px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            box-shadow: 0 10px 26px -12px rgba(16, 24, 40, 0.4);
        }
        .widget[data-c='0'] {
            background: linear-gradient(135deg, var(--s1), color-mix(in srgb, var(--s1) 60%, #000));
        }
        .widget[data-c='1'] {
            background: linear-gradient(135deg, var(--s6), color-mix(in srgb, var(--s6) 60%, #000));
        }
        .widget[data-c='2'] {
            background: linear-gradient(135deg, var(--s3), color-mix(in srgb, var(--s3) 60%, #000));
        }
        .widget[data-c='3'] {
            background: linear-gradient(135deg, var(--s4), color-mix(in srgb, var(--s4) 60%, #000));
        }
        .wk {
            font: 600 12px var(--font);
            letter-spacing: 0.04em;
            opacity: 0.92;
        }
        .wv {
            font: 800 28px/1 var(--font-d, var(--font));
            letter-spacing: -0.02em;
            font-variant-numeric: tabular-nums;
        }
        .content {
            padding: 20px 30px 60px;
            display: flex;
            flex-direction: column;
            gap: 24px;
        }
        .content section {
            scroll-margin-top: 20px;
        }
        @media (max-width: 980px) {
            .app {
                flex-direction: column;
            }
            .rail {
                width: auto;
                height: auto;
                position: static;
                flex-direction: row;
                flex-wrap: wrap;
                align-items: center;
            }
            .nav {
                flex-direction: row;
                flex-wrap: wrap;
                width: 100%;
            }
            .nav button {
                width: auto;
            }
            .rail-foot {
                display: none;
            }
            .widgets {
                grid-template-columns: repeat(2, 1fr);
            }
            .content,
            .widgets {
                padding-left: 16px;
                padding-right: 16px;
            }
        }
        @media (max-width: 560px) {
            .widgets {
                grid-template-columns: 1fr;
            }
        }
    `,
})
export class ConsoleLayoutComponent extends TemplateLayoutBase {}
