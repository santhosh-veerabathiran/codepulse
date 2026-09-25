import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FilterBarComponent } from '../filter.bar.component';
import { SectionIconComponent } from '../section.icon.component';
import { SelectComponent } from '../select.component';
import { TemplateMenuComponent } from '../template.menu.component';
import { ThemeMenuComponent } from '../theme.menu.component';
import { TemplateLayoutBase } from './layout.base';

@Component({
    selector: 'cp-classic-layout',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgComponentOutlet, FilterBarComponent, ThemeMenuComponent, TemplateMenuComponent, SelectComponent, SectionIconComponent],
    template: `
        <div class="app">
            <aside class="sidebar">
                <div class="logo">
                    <span class="mk">C</span>
                    <div>
                        CodePulse<small>{{ repoCount() }} repos · git analytics</small>
                    </div>
                </div>

                <p class="grp">Contributor</p>
                <cp-select icon="user" [options]="contribOpts()" [value]="personValue()" (picked)="pick($event)" />
                <div class="side-nav">
                    <button type="button" (click)="step(-1)">‹ Prev</button>
                    <button type="button" (click)="step(1)">Next ›</button>
                </div>

                <p class="grp">Jump to</p>
                <nav class="nav">
                    @for (s of sections(); track s.id) {
                        <button
                            type="button"
                            draggable="true"
                            [class.active]="active() === s.id"
                            [class.dragging]="dragId() === s.id"
                            (click)="jump(s.id)"
                            (dragstart)="onDragStart(s.id)"
                            (dragover)="onDragOver($event, s.id)"
                            (drop)="onDrop($event)"
                            (dragend)="onDragEnd()"
                        >
                            <cp-sec-icon class="ic" [id]="s.id" [size]="16" [style.color]="s.color" />
                            {{ s.label }}
                        </button>
                    }
                </nav>

                <div class="sidefoot">
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
                        <h1>Team Analytics</h1>
                        <p class="sub">{{ repoSub() }}</p>
                    </div>
                    <div class="tools">
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
        .sidebar {
            width: 236px;
            flex: none;
            background: radial-gradient(120% 60% at 0% 0%, color-mix(in srgb, var(--acc) 10%, transparent), transparent 60%), linear-gradient(180deg, color-mix(in srgb, var(--surface) 94%, transparent), var(--surface) 45%);
            border-right: 1px solid var(--glass-brd, var(--line));
            padding: 18px 14px;
            display: flex;
            flex-direction: column;
            gap: 4px;
            position: sticky;
            top: 0;
            height: 100vh;
            overflow-y: auto;
            z-index: 30;
        }
        .logo {
            display: flex;
            align-items: center;
            gap: 11px;
            font: 800 15.5px/1 var(--font-d, var(--font));
            letter-spacing: -0.02em;
            color: var(--ink);
            padding: 2px 6px 4px;
        }
        .logo .mk {
            width: 32px;
            height: 32px;
            border-radius: 10px;
            background: var(--grad, var(--acc));
            color: #04121c;
            display: grid;
            place-items: center;
            font-size: 16px;
            font-weight: 800;
            flex: none;
            box-shadow:
                0 4px 16px -2px var(--acc-soft),
                inset 0 1px 0 rgba(255, 255, 255, 0.4);
            animation: mk-glow 4.5s ease-in-out infinite;
        }
        @keyframes mk-glow {
            0%,
            100% {
                box-shadow:
                    0 4px 16px -2px var(--acc-soft),
                    inset 0 1px 0 rgba(255, 255, 255, 0.4);
            }
            50% {
                box-shadow:
                    0 6px 26px 0 var(--acc-soft),
                    inset 0 1px 0 rgba(255, 255, 255, 0.5);
            }
        }
        .logo small {
            display: block;
            font: 600 10px/1.35 var(--font);
            color: var(--muted);
            margin-top: 3px;
            letter-spacing: 0;
        }
        .grp {
            font: 700 10px/1 var(--font);
            letter-spacing: 0.12em;
            color: var(--muted);
            margin: 16px 8px 8px;
        }
        .side-nav {
            display: flex;
            gap: 8px;
            padding: 8px 0 0;
        }
        .side-nav button {
            flex: 1;
            background: var(--surface-2);
            border: 1px solid var(--line);
            color: var(--ink-2, var(--ink));
            border-radius: 9px;
            padding: 8px;
            font: 700 12px var(--font);
            cursor: pointer;
            transition: 0.14s;
        }
        .side-nav button:hover {
            color: var(--acc-ink, var(--acc));
            border-color: var(--acc-line, var(--acc));
            background: var(--acc-soft);
        }
        .nav {
            display: flex;
            flex-direction: column;
            gap: 1px;
        }
        .nav button {
            width: 100%;
            text-align: left;
            background: none;
            border: 0;
            color: var(--ink-2, var(--muted));
            padding: 9px 11px;
            border-radius: 9px;
            cursor: pointer;
            font: 600 12.5px/1 var(--font);
            display: flex;
            align-items: center;
            gap: 11px;
            position: relative;
            transition:
                background 0.14s,
                color 0.14s,
                transform 0.14s;
        }
        .nav button:hover {
            background: var(--surface-2);
            color: var(--ink);
            transform: translateX(2px);
        }
        .nav button:active {
            cursor: grabbing;
        }
        .nav button.dragging {
            opacity: 0.45;
            background: var(--surface-2);
        }
        .nav button.active {
            color: var(--acc-ink, var(--acc));
            background: linear-gradient(90deg, var(--acc-soft), transparent 80%);
            font-weight: 700;
        }
        .nav button.active::before {
            content: '';
            position: absolute;
            left: 2px;
            top: 7px;
            bottom: 7px;
            width: 3px;
            border-radius: 3px;
            background: var(--grad, var(--acc));
            box-shadow: 0 0 10px var(--acc);
        }
        .nav .ic {
            display: inline-flex;
            flex: none;
            opacity: 0.9;
        }
        .nav button.active .ic {
            opacity: 1;
        }
        .sidefoot {
            margin-top: auto;
            padding-top: 14px;
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        .sidefoot > div {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            padding: 6px 8px;
            border-radius: 8px;
            font: 600 11px var(--font);
            color: var(--muted);
        }
        .sidefoot b {
            color: var(--ink);
            font-size: 14px;
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
            padding: 22px 30px 6px;
            flex-wrap: wrap;
        }
        .brand h1 {
            margin: 0;
            font: 800 24px/1.1 var(--font-d, var(--font));
            letter-spacing: -0.03em;
            background: linear-gradient(100deg, var(--ink) 35%, var(--acc-ink, var(--acc)));
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
        }
        .sub {
            color: var(--muted);
            font: 600 12px var(--font);
            margin: 5px 0 0;
            max-width: 70ch;
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
            cursor: pointer;
            flex: none;
        }
        .gear:hover {
            border-color: var(--acc);
            color: var(--ink);
        }
        .content {
            padding: 16px 30px 60px;
            display: flex;
            flex-direction: column;
            gap: 30px;
        }
        .content section {
            scroll-margin-top: 20px;
        }
        @media (max-width: 900px) {
            .app {
                flex-direction: column;
            }
            .sidebar {
                width: auto;
                height: auto;
                position: static;
                flex-direction: row;
                flex-wrap: wrap;
                align-items: center;
                gap: 10px;
            }
            .nav {
                flex-direction: row;
                flex-wrap: wrap;
                width: 100%;
            }
            .nav button {
                width: auto;
            }
            .sidefoot {
                display: none;
            }
            .content {
                padding: 16px 16px 60px;
            }
        }
    `,
})
export class ClassicLayoutComponent extends TemplateLayoutBase {}
