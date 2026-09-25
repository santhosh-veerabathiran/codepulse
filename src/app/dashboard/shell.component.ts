import { NgComponentOutlet } from '@angular/common';
import { afterNextRender, ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, signal } from '@angular/core';
import { AnalyticsStore, ALL, FactsStore, FilterUrl, FiltersStore, NavStore, format } from '../core';
import { ActivityComponent } from './activity.component';
import { CollabComponent } from './collab.component';
import { CommandPaletteComponent } from './command.palette.component';
import { CompareComponent } from './compare.component';
import { FilterBarComponent } from './filter.bar.component';
import { InsightsComponent } from './insights.component';
import { KpisComponent } from './kpis.component';
import { LeaderboardComponent } from './leaderboard.component';
import { MrComponent } from './mr.component';
import { OnboardingComponent } from './onboarding.component';
import { OwnershipComponent } from './ownership.component';
import { PulseComponent } from './pulse.component';
import { QualityComponent } from './quality.component';
import { RhythmComponent } from './rhythm.component';
import { SelectComponent } from './select.component';
import { SelectOption } from './types';
import { SettingsComponent } from './settings.component';
import { ThemeMenuComponent } from './theme.menu.component';
import { TrendComponent } from './trend.component';
import { WorkComponent } from './work.component';
import { ReposComponent } from './repos.component';
import { MomentumComponent } from './momentum.component';
import { BiggestComponent } from './biggest.component';
import { NavItem } from './types';

@Component({
    selector: 'cp-shell',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgComponentOutlet, FilterBarComponent, OnboardingComponent, SettingsComponent, ThemeMenuComponent, CommandPaletteComponent, SelectComponent],
    template: `
        @if (loading()) {
            <p class="state">Loading…</p>
        } @else if (showOnboarding()) {
            <cp-onboarding />
        } @else {
            <div class="app">
                <aside class="sidebar">
                    <div class="logo">
                        <span class="mk">C</span>
                        <div>CodePulse<small>{{ repoCount() }} repos · git analytics</small></div>
                    </div>

                    <p class="grp">Contributor</p>
                    <cp-select [options]="contribOpts()" [value]="personValue()" (picked)="pick($event)" />
                    <div class="side-nav">
                        <button type="button" (click)="step(-1)">‹ Prev</button>
                        <button type="button" (click)="step(1)">Next ›</button>
                    </div>

                    <p class="grp">Jump to</p>
                    <nav class="nav">
                        @for (s of visibleSections(); track s.id) {
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
                                <svg class="ic" [style.color]="s.color" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                    @switch (s.id) {
                                        @case ('sec-team') { <circle cx="9" cy="7" r="3" /><path d="M2 21v-1a6 6 0 0 1 12 0v1" /><path d="M16 3.2a4 4 0 0 1 0 7.6" /><path d="M22 21v-1a6 6 0 0 0-3-5.2" /> }
                                        @case ('sec-person') { <circle cx="12" cy="8" r="4" /><path d="M4 21v-1a8 8 0 0 1 16 0v1" /> }
                                        @case ('sec-trend') { <polyline points="3 17 9 11 13 15 21 6" /><polyline points="15 6 21 6 21 12" /> }
                                        @case ('sec-repos') { <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /> }
                                        @case ('sec-momentum') { <line x1="6" y1="20" x2="6" y2="14" /><line x1="12" y1="20" x2="12" y2="9" /><line x1="18" y1="20" x2="18" y2="4" /> }
                                        @case ('sec-biggest') { <path d="M12 22a6 6 0 0 0 6-6c0-4-3-6-4-10-2 2-3 3-3 6-1-.5-1.5-1.5-1.5-3C7 11 6 13 6 16a6 6 0 0 0 6 6z" /> }
                                        @case ('sec-quality') { <path d="M12 2 2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /> }
                                        @case ('sec-mr') { <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="6" r="3" /><path d="M18 9a9 9 0 0 1-9 9" /><path d="M6 9v6" /> }
                                        @case ('sec-work') { <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /> }
                                        @case ('sec-ownership') { <circle cx="8" cy="15" r="4" /><path d="M10.8 12.2 20 3" /><path d="M17 6l2 2" /><path d="M14 9l2 2" /> }
                                        @case ('sec-activity') { <rect x="3" y="4" width="18" height="17" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="16" y1="2" x2="16" y2="6" /> }
                                        @case ('sec-rhythm') { <polyline points="2 12 6 12 9 4 15 20 18 12 22 12" /> }
                                        @case ('sec-pulse') { <path d="M20.8 5.6a5 5 0 0 0-8.8-2 5 5 0 0 0-8.8 2c-1 2.4 0 4.9 1.8 6.6L12 20l7-7.8c1.8-1.7 2.8-4.2 1.8-6.6z" /> }
                                        @case ('sec-collab') { <path d="M9 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7L11 5" /><path d="M15 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7L13 19" /> }
                                        @case ('sec-insights') { <polygon points="12 2 14.6 8.8 21.5 9.2 16.2 13.7 18 20.4 12 16.5 6 20.4 7.8 13.7 2.5 9.2 9.4 8.8" /> }
                                        @case ('sec-compare') { <line x1="12" y1="3" x2="12" y2="21" /><path d="M12 6 6 8l3 6a3 3 0 0 1-6 0l3-6z" /><path d="M12 6l6-2 3 6a3 3 0 0 1-6 0l3-6z" /> }
                                    }
                                </svg>
                                {{ s.label }}
                            </button>
                        }
                    </nav>

                    <div class="sidefoot">
                        @for (g of grand(); track g.l) {
                            <div><span>{{ g.l }}</span><b>{{ g.v }}</b></div>
                        }
                    </div>
                </aside>

                <main class="main">
                    <header class="topbar">
                        <div class="brand">
                            <h1>Team analytics</h1>
                            <p class="sub">{{ repoSub() }}</p>
                        </div>
                        <div class="tools">
                            <cp-theme-menu />
                            <button type="button" class="gear" (click)="openSettings()" aria-label="Settings">⚙</button>
                        </div>
                    </header>

                    <div class="content">
                        <cp-filter-bar />
                        @for (s of visibleSections(); track s.id) {
                            <section [id]="s.id"><ng-container *ngComponentOutlet="s.component" /></section>
                        }
                    </div>
                </main>
            </div>
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
        .app {
            display: flex;
            min-height: 100vh;
            position: relative;
            z-index: 1;
        }
        .sidebar {
            width: 236px;
            flex: none;
            background:
                radial-gradient(120% 60% at 0% 0%, color-mix(in srgb, var(--acc) 10%, transparent), transparent 60%),
                linear-gradient(180deg, color-mix(in srgb, var(--surface) 94%, transparent), var(--surface) 45%);
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
        .cmb {
            width: 100%;
            background: var(--surface-2);
            color: var(--ink);
            border: 1px solid var(--line);
            border-radius: 9px;
            padding: 9px 10px;
            font: 600 12.5px var(--font);
            outline: none;
        }
        .cmb:focus {
            border-color: var(--acc);
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
            background: var(--acc-soft);
            font-weight: 700;
        }
        .nav button.active {
            background: linear-gradient(90deg, var(--acc-soft), transparent 80%);
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
            width: 16px;
            height: 16px;
            flex: none;
            opacity: 0.9;
            stroke-width: var(--icon-stroke, 1.8);
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
        .ph {
            min-height: 320px;
            border-radius: var(--radius, 14px);
            background: var(--surface);
            border: 1px solid var(--line);
            opacity: 0.4;
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
export class ShellComponent {
    private readonly factsStore = inject(FactsStore);
    private readonly analytics = inject(AnalyticsStore);
    private readonly filters = inject(FiltersStore);
    private readonly nav = inject(NavStore);
    private readonly host = inject(ElementRef<HTMLElement>);
    private readonly filterUrl = inject(FilterUrl);

    protected readonly loading = this.factsStore.loading;
    protected readonly settingsOpen = this.nav.settingsOpen;
    protected readonly active = signal<string>('sec-team');

    private readonly ORDER_KEY = 'codepulse.navorder';
    protected readonly dragId = signal<string>('');
    protected readonly sections = signal<NavItem[]>([
        { id: 'sec-team', label: 'Contributors', icon: '☰', color: 'var(--s1)', component: LeaderboardComponent },
        { id: 'sec-person', label: 'Selected person', icon: '◎', color: 'var(--s2)', component: KpisComponent },
        { id: 'sec-trend', label: 'Activity trend', icon: '📈', color: 'var(--s8)', component: TrendComponent },
        { id: 'sec-repos', label: 'By repository', icon: '▤', color: 'var(--s6)', component: ReposComponent },
        { id: 'sec-momentum', label: 'Year over year', icon: '↗', color: 'var(--s4)', component: MomentumComponent },
        { id: 'sec-quality', label: 'Line quality', icon: '◇', color: 'var(--s3)', component: QualityComponent },
        { id: 'sec-mr', label: 'Merge requests', icon: '⇌', color: 'var(--s4)', component: MrComponent },
        { id: 'sec-biggest', label: 'Biggest commits', icon: '🔥', color: 'var(--s6)', component: BiggestComponent },
        { id: 'sec-work', label: 'Work & familiarity', icon: '◆', color: 'var(--s7)', component: WorkComponent },
        { id: 'sec-ownership', label: 'Ownership', icon: '⚿', color: 'var(--s2)', component: OwnershipComponent },
        { id: 'sec-activity', label: 'Activity calendar', icon: '▦', color: 'var(--s1)', component: ActivityComponent },
        { id: 'sec-rhythm', label: 'Rhythm & records', icon: '♪', color: 'var(--s4)', component: RhythmComponent },
        { id: 'sec-pulse', label: 'Team pulse', icon: '❤', color: 'var(--s3)', teamOnly: true, component: PulseComponent },
        { id: 'sec-collab', label: 'Collaboration', icon: '⚭', color: 'var(--s5)', teamOnly: true, component: CollabComponent },
        { id: 'sec-insights', label: 'What stands out', icon: '✦', color: 'var(--s6)', component: InsightsComponent },
        { id: 'sec-compare', label: 'Compare', icon: '⇄', color: 'var(--s5)', component: CompareComponent },
    ]);

    protected readonly teamMode = computed<boolean>(() => {
        return this.filters.personId() === ALL;
    });
    protected readonly visibleSections = computed<NavItem[]>(() => {
        if (this.teamMode()) {
            return this.sections();
        }
        return this.sections().filter((s) => {
            return !s.teamOnly;
        });
    });
    protected readonly showOnboarding = computed<boolean>(() => {
        return this.nav.showSetup() || this.factsStore.facts() === undefined;
    });
    protected readonly repoCount = computed<number>(() => {
        return this.factsStore.facts()?.repos.length ?? 0;
    });
    protected readonly people = computed<{ id: number; name: string }[]>(() => {
        return this.analytics.ranked().map((r) => {
            return { id: r.id, name: r.name };
        });
    });
    protected readonly contribOpts = computed<SelectOption[]>(() => {
        return [
            { value: 'ALL', label: 'All contributors' },
            ...this.people().map((p) => {
                return { value: String(p.id), label: p.name };
            }),
        ];
    });
    protected readonly personValue = computed<string>(() => {
        const id = this.filters.personId();
        return id === ALL ? 'ALL' : String(id);
    });

    protected readonly repoSub = computed<string>(() => {
        const facts = this.factsStore.facts();
        if (!facts) {
            return '';
        }
        return `${facts.repos.length} repositories · git contribution analytics`;
    });

    protected readonly grand = computed<{ v: string; l: string }[]>(() => {
        const g = this.factsStore.facts()?.grand;
        if (!g) {
            return [];
        }
        return [
            { v: format(g.commits), l: 'Commits' },
            { v: format(g.merges), l: 'Merge commits' },
            { v: format(g.mrs), l: 'Merged MRs' },
            { v: String(g.contributors), l: 'Contributors' },
        ];
    });

    constructor() {
        this.restoreOrder();
        afterNextRender(() => {
            this.observeSections();
        });
        effect(() => {
            const target = this.nav.scrollTarget();
            if (target && !this.showOnboarding()) {
                this.jump(target);
            }
        });
    }

    protected onDragStart(id: string) {
        this.dragId.set(id);
    }

    protected onDragOver(event: DragEvent, overId: string) {
        event.preventDefault();
        const from = this.dragId();
        if (from && from !== overId) {
            this.moveSection(from, overId);
        }
    }

    protected onDrop(event: DragEvent) {
        event.preventDefault();
        this.persistOrder();
    }

    protected onDragEnd() {
        this.dragId.set('');
        this.persistOrder();
    }

    private moveSection(fromId: string, overId: string) {
        const list = [...this.sections()];
        const fromIndex = list.findIndex((s) => {
            return s.id === fromId;
        });
        const overIndex = list.findIndex((s) => {
            return s.id === overId;
        });
        if (fromIndex < 0 || overIndex < 0) {
            return;
        }
        const [moved] = list.splice(fromIndex, 1);
        list.splice(overIndex, 0, moved);
        this.sections.set(list);
    }

    private persistOrder() {
        try {
            const ids = this.sections().map((s) => {
                return s.id;
            });
            localStorage.setItem(this.ORDER_KEY, JSON.stringify(ids));
        } catch {
            /* storage unavailable (private mode) */
        }
    }

    private restoreOrder() {
        let ids: string[] = [];
        try {
            ids = JSON.parse(localStorage.getItem(this.ORDER_KEY) ?? '[]');
        } catch {
            return;
        }
        if (!Array.isArray(ids) || !ids.length) {
            return;
        }
        const byId = new Map(
            this.sections().map((s) => {
                return [s.id, s] as const;
            }),
        );
        const ordered: NavItem[] = [];
        for (const id of ids) {
            const section = byId.get(id);
            if (section) {
                ordered.push(section);
                byId.delete(id);
            }
        }
        for (const section of byId.values()) {
            ordered.push(section);
        }
        this.sections.set(ordered);
    }

    protected openSettings() {
        this.nav.openSettings();
    }

    protected pick(value: string) {
        this.filters.personId.set(value === 'ALL' ? ALL : Number(value));
    }

    protected step(dir: number) {
        const ids = this.people().map((p) => {
            return p.id;
        });
        if (!ids.length) {
            return;
        }
        const cur = this.filters.personId();
        const start = cur === ALL ? (dir > 0 ? -1 : 0) : ids.indexOf(cur as number);
        const idx = (start + dir + ids.length) % ids.length;
        this.filters.personId.set(ids[idx]);
    }

    protected jump(id: string) {
        this.active.set(id);
        this.host.nativeElement.querySelector(`#${id}`)?.scrollIntoView({ block: 'start' });
    }

    private observeSections() {
        const nodes = this.host.nativeElement.querySelectorAll('.content section[id]');
        if (!nodes.length) {
            return;
        }
        const spy = new IntersectionObserver(
            (entries) => {
                for (const e of entries) {
                    if (e.isIntersecting) {
                        this.active.set((e.target as HTMLElement).id);
                    }
                }
            },
            { rootMargin: '-15% 0px -70% 0px', threshold: 0 },
        );
        nodes.forEach((n: Element) => {
            spy.observe(n);
        });
    }
}
