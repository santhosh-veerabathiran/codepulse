import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, Type } from '@angular/core';
import { FactsStore, NavStore, TemplateStore } from '../core';
import { CommandPaletteComponent } from './command.palette.component';
import { OnboardingComponent } from './onboarding.component';
import { SettingsComponent } from './settings.component';
import { ClassicLayoutComponent } from './templates/classic.layout.component';
import { ConsoleLayoutComponent } from './templates/console.layout.component';
import { EditorialLayoutComponent } from './templates/editorial.layout.component';
import { StudioLayoutComponent } from './templates/studio.layout.component';
import { TerminalLayoutComponent } from './templates/terminal.layout.component';

@Component({
    selector: 'cp-template-shell',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgComponentOutlet, OnboardingComponent, SettingsComponent, CommandPaletteComponent],
    template: `
        @if (loading()) {
            <p class="state">Loading…</p>
        } @else if (showOnboarding()) {
            <cp-onboarding />
        } @else {
            <ng-container *ngComponentOutlet="activeLayout()" />
        }
        @if (settingsOpen()) {
            <cp-settings />
        }
        @if (!showOnboarding()) {
            <cp-command-palette />
        }
    `,
    styles: `
        :host {
            display: block;
            min-height: 100vh;
        }
        .state {
            padding: 60px;
            text-align: center;
            color: var(--muted);
            font-size: 14px;
        }
    `,
})
export class TemplateShellComponent {
    readonly template = input<string>('classic');

    private readonly templateStore = inject(TemplateStore);
    private readonly factsStore = inject(FactsStore);
    private readonly nav = inject(NavStore);

    protected readonly loading = this.factsStore.loading;
    protected readonly settingsOpen = this.nav.settingsOpen;

    protected readonly showOnboarding = computed<boolean>(() => {
        return this.nav.showSetup() || this.factsStore.facts() === undefined;
    });

    private readonly layouts: Record<string, Type<unknown>> = {
        classic: ClassicLayoutComponent,
        terminal: TerminalLayoutComponent,
        studio: StudioLayoutComponent,
        editorial: EditorialLayoutComponent,
        console: ConsoleLayoutComponent,
    };

    protected readonly activeLayout = computed<Type<unknown>>(() => {
        return this.layouts[this.templateStore.current()] ?? ClassicLayoutComponent;
    });

    constructor() {
        effect(() => {
            this.templateStore.apply(this.template());
        });
    }
}
