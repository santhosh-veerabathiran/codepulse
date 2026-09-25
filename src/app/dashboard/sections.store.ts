import { computed, inject, Injectable, signal } from '@angular/core';
import { ALL, DEFAULT_SECTION, FiltersStore, NAV_ORDER_KEY } from '../core';
import { ActivityComponent } from './activity.component';
import { BiggestComponent } from './biggest.component';
import { CollabComponent } from './collab.component';
import { CompareComponent } from './compare.component';
import { InsightsComponent } from './insights.component';
import { KpisComponent } from './kpis.component';
import { LeaderboardComponent } from './leaderboard.component';
import { MomentumComponent } from './momentum.component';
import { MrComponent } from './mr.component';
import { OwnershipComponent } from './ownership.component';
import { PulseComponent } from './pulse.component';
import { QualityComponent } from './quality.component';
import { ReposComponent } from './repos.component';
import { RhythmComponent } from './rhythm.component';
import { TrendComponent } from './trend.component';
import { NavItem } from './types';
import { WorkComponent } from './work.component';

@Injectable({ providedIn: 'root' })
export class SectionsStore {
    private readonly filters = inject(FiltersStore);

    readonly all = signal<NavItem[]>([
        { id: 'sec-team', label: 'Contributors', icon: '☰', color: 'var(--s1)', component: LeaderboardComponent },
        { id: 'sec-person', label: 'Selected Person', icon: '◎', color: 'var(--s2)', component: KpisComponent },
        { id: 'sec-trend', label: 'Activity Trend', icon: '📈', color: 'var(--s8)', component: TrendComponent },
        { id: 'sec-repos', label: 'By Repository', icon: '▤', color: 'var(--s6)', component: ReposComponent },
        { id: 'sec-momentum', label: 'Year over Year', icon: '↗', color: 'var(--s4)', component: MomentumComponent },
        { id: 'sec-quality', label: 'Line Quality', icon: '◇', color: 'var(--s3)', component: QualityComponent },
        { id: 'sec-mr', label: 'Merge Requests', icon: '⇌', color: 'var(--s4)', component: MrComponent },
        { id: 'sec-biggest', label: 'Biggest Commits', icon: '🔥', color: 'var(--s6)', component: BiggestComponent },
        { id: 'sec-work', label: 'Work & Familiarity', icon: '◆', color: 'var(--s7)', component: WorkComponent },
        { id: 'sec-ownership', label: 'Ownership', icon: '⚿', color: 'var(--s2)', component: OwnershipComponent },
        { id: 'sec-activity', label: 'Activity Calendar', icon: '▦', color: 'var(--s1)', component: ActivityComponent },
        { id: 'sec-rhythm', label: 'Rhythm & Records', icon: '♪', color: 'var(--s4)', component: RhythmComponent },
        { id: 'sec-pulse', label: 'Team Pulse', icon: '❤', color: 'var(--s3)', teamOnly: true, component: PulseComponent },
        { id: 'sec-collab', label: 'Collaboration', icon: '⚭', color: 'var(--s5)', teamOnly: true, component: CollabComponent },
        { id: 'sec-insights', label: 'What Stands Out', icon: '✦', color: 'var(--s6)', component: InsightsComponent },
        { id: 'sec-compare', label: 'Compare', icon: '⇄', color: 'var(--s5)', component: CompareComponent },
    ]);

    readonly active = signal<string>(this.initialActive());
    readonly dragId = signal<string>('');

    readonly teamMode = computed<boolean>(() => {
        return this.filters.personId() === ALL;
    });

    readonly visible = computed<NavItem[]>(() => {
        if (this.teamMode()) {
            return this.all();
        }
        return this.all().filter((s) => {
            return !s.teamOnly;
        });
    });

    constructor() {
        this.restoreOrder();
    }

    move(fromId: string, overId: string) {
        const list = [...this.all()];
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
        this.all.set(list);
    }

    persistOrder() {
        try {
            const ids = this.all().map((s) => {
                return s.id;
            });
            localStorage.setItem(NAV_ORDER_KEY, JSON.stringify(ids));
        } catch {
            /* storage unavailable (private mode) */
        }
    }

    private initialActive(): string {
        try {
            const fragment = decodeURIComponent(location.hash.slice(1));
            return /^sec-[a-z]+$/.test(fragment) ? fragment : DEFAULT_SECTION;
        } catch {
            return DEFAULT_SECTION;
        }
    }

    private restoreOrder() {
        const ids = this.storedOrder();
        if (!ids.length) {
            return;
        }
        const byId = new Map(
            this.all().map((s) => {
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
        this.all.set(ordered);
    }

    private storedOrder(): string[] {
        try {
            const parsed = JSON.parse(localStorage.getItem(NAV_ORDER_KEY) ?? '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }
}
