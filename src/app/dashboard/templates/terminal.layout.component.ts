import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FilterBarComponent } from '../filter.bar.component';
import { SelectComponent } from '../select.component';
import { TemplateMenuComponent } from '../template.menu.component';
import { ThemeMenuComponent } from '../theme.menu.component';
import { TemplateLayoutBase } from './layout.base';

@Component({
    selector: 'cp-terminal-layout',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgComponentOutlet, FilterBarComponent, ThemeMenuComponent, TemplateMenuComponent, SelectComponent],
    template: `
        <div class="term">
            <header class="bar">
                <div class="brand">
                    <span class="prompt">~/</span>codepulse<span class="cur"></span>
                    <span class="meta">{{ repoCount() }} repos</span>
                </div>
                <div class="ticker">
                    @for (g of grand(); track g.l) {
                        <span class="tk"
                            ><i>{{ g.l }}</i
                            >{{ g.v }}</span
                        >
                    }
                </div>
                <div class="tools">
                    <cp-template-menu />
                    <cp-theme-menu />
                    <button type="button" class="gear" (click)="openSettings()" aria-label="Settings">⚙</button>
                </div>
            </header>

            <div class="sub">
                <div class="who">
                    <span class="lbl">Contributor</span>
                    <cp-select icon="user" [options]="contribOpts()" [value]="personValue()" (picked)="pick($event)" />
                    <button type="button" class="stp" (click)="step(-1)" aria-label="Previous">‹</button>
                    <button type="button" class="stp" (click)="step(1)" aria-label="Next">›</button>
                </div>
                <nav class="tabs">
                    @for (s of sections(); track s.id) {
                        <button type="button" [class.active]="active() === s.id" (click)="jump(s.id)">{{ s.label }}</button>
                    }
                </nav>
            </div>

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
        .term {
            position: relative;
            z-index: 1;
            min-height: 100vh;
        }
        .term::before {
            content: '';
            position: fixed;
            inset: 0;
            z-index: -1;
            pointer-events: none;
            background-image: linear-gradient(color-mix(in srgb, var(--ink) 5%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--ink) 5%, transparent) 1px, transparent 1px);
            background-size: 44px 44px;
            opacity: 0.5;
            -webkit-mask-image: radial-gradient(120% 90% at 50% 0%, #000 30%, transparent 78%);
            mask-image: radial-gradient(120% 90% at 50% 0%, #000 30%, transparent 78%);
        }
        .bar {
            display: flex;
            align-items: center;
            gap: 20px;
            padding: 14px 22px;
            border-bottom: 1px solid var(--line);
            background: color-mix(in srgb, var(--surface) 80%, var(--app));
            position: sticky;
            top: 0;
            z-index: 30;
        }
        .brand {
            font: 700 15px var(--mono);
            color: var(--ink);
            letter-spacing: -0.01em;
            display: flex;
            align-items: center;
            white-space: nowrap;
        }
        .brand .prompt {
            color: var(--acc);
        }
        .brand .cur {
            width: 8px;
            height: 16px;
            margin-left: 3px;
            background: var(--acc);
            display: inline-block;
            animation: blink 1.1s steps(1) infinite;
        }
        @keyframes blink {
            50% {
                opacity: 0;
            }
        }
        .brand .meta {
            font: 600 10.5px var(--mono);
            color: var(--muted);
            margin-left: 12px;
            padding-left: 12px;
            border-left: 1px solid var(--line);
        }
        .ticker {
            display: flex;
            gap: 22px;
            overflow-x: auto;
            flex: 1;
            scrollbar-width: none;
            mask-image: linear-gradient(90deg, transparent, #000 4%, #000 96%, transparent);
        }
        .ticker::-webkit-scrollbar {
            display: none;
        }
        .tk {
            font: 700 13px var(--mono);
            color: var(--ink);
            white-space: nowrap;
            font-variant-numeric: tabular-nums;
            display: flex;
            gap: 7px;
            align-items: baseline;
        }
        .tk i {
            font: 600 10px var(--mono);
            color: var(--muted);
            letter-spacing: 0.02em;
            font-style: normal;
        }
        .tools {
            display: flex;
            gap: 8px;
            align-items: center;
            flex: none;
        }
        .gear {
            border: 1px solid var(--line);
            background: var(--surface-2);
            color: var(--ink-2, var(--muted));
            border-radius: 4px;
            width: 36px;
            height: 36px;
            font-size: 15px;
        }
        .gear:hover {
            border-color: var(--acc);
            color: var(--ink);
        }
        .sub {
            display: flex;
            align-items: center;
            gap: 18px;
            padding: 10px 22px;
            border-bottom: 1px solid var(--line);
            background: color-mix(in srgb, var(--surface) 55%, transparent);
            position: sticky;
            top: 57px;
            z-index: 29;
            flex-wrap: wrap;
        }
        .who {
            display: flex;
            align-items: center;
            gap: 7px;
            flex: none;
        }
        .who .lbl {
            font: 600 11px var(--mono);
            color: var(--muted);
            letter-spacing: 0.02em;
        }
        .stp {
            border: 1px solid var(--line);
            background: var(--surface-2);
            color: var(--ink-2);
            border-radius: 4px;
            width: 30px;
            height: 30px;
            font: 700 13px var(--mono);
        }
        .stp:hover {
            border-color: var(--acc);
            color: var(--acc);
        }
        .tabs {
            display: flex;
            gap: 2px;
            overflow-x: auto;
            flex: 1;
            scrollbar-width: none;
        }
        .tabs::-webkit-scrollbar {
            display: none;
        }
        .tabs button {
            font: 600 12px var(--mono);
            color: var(--muted);
            letter-spacing: 0.01em;
            padding: 7px 11px;
            border-radius: 4px;
            white-space: nowrap;
            border-bottom: 2px solid transparent;
            transition:
                color 0.14s,
                background 0.14s;
        }
        .tabs button:hover {
            color: var(--ink);
            background: var(--surface-2);
        }
        .tabs button.active {
            color: var(--acc-ink, var(--acc));
            border-bottom-color: var(--acc);
        }
        .content {
            padding: 18px 22px 60px;
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        .content section {
            scroll-margin-top: 108px;
        }
        @media (max-width: 720px) {
            .bar {
                flex-wrap: wrap;
                gap: 12px;
            }
            .ticker {
                order: 3;
                width: 100%;
                flex: 1 1 100%;
            }
            .content {
                padding: 16px 14px 60px;
            }
        }
    `,
})
export class TerminalLayoutComponent extends TemplateLayoutBase {}
