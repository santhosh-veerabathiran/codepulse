import { afterNextRender, computed, effect, ElementRef, inject } from '@angular/core';
import { ALL, AnalyticsStore, FactsStore, FiltersStore, format, NavStore } from '../../core';
import { SectionsStore } from '../sections.store';
import { SelectOption } from '../types';

export abstract class TemplateLayoutBase {
    protected readonly factsStore = inject(FactsStore);
    protected readonly analytics = inject(AnalyticsStore);
    protected readonly filters = inject(FiltersStore);
    protected readonly nav = inject(NavStore);
    protected readonly sectionsStore = inject(SectionsStore);
    private readonly host = inject(ElementRef<HTMLElement>);

    protected readonly sections = this.sectionsStore.visible;
    protected readonly active = this.sectionsStore.active;
    protected readonly dragId = this.sectionsStore.dragId;
    protected readonly teamMode = this.sectionsStore.teamMode;

    protected readonly repoCount = computed<number>(() => {
        return this.factsStore.facts()?.repos.length ?? 0;
    });

    protected readonly repoSub = computed<string>(() => {
        const facts = this.factsStore.facts();
        if (!facts) {
            return '';
        }
        return `${facts.repos.length} repositories · git contribution analytics`;
    });

    protected readonly people = computed<{ id: number; name: string }[]>(() => {
        return this.analytics.ranked().map((r) => {
            return { id: r.id, name: r.name };
        });
    });

    protected readonly contribOpts = computed<SelectOption[]>(() => {
        return [
            { value: 'ALL', label: 'All Contributors' },
            ...this.people().map((p) => {
                return { value: String(p.id), label: p.name };
            }),
        ];
    });

    protected readonly personValue = computed<string>(() => {
        const id = this.filters.personId();
        return id === ALL ? 'ALL' : String(id);
    });

    protected readonly grand = computed<{ v: string; l: string }[]>(() => {
        const g = this.factsStore.facts()?.grand;
        if (!g) {
            return [];
        }
        return [
            { v: format(g.commits), l: 'Commits' },
            { v: format(g.merges), l: 'Merge Commits' },
            { v: format(g.mrs), l: 'Merged MRs' },
            { v: String(g.contributors), l: 'Contributors' },
        ];
    });

    constructor() {
        effect(() => {
            const target = this.nav.scrollTarget();
            if (target) {
                this.jump(target);
            }
        });
        effect(() => {
            const id = this.active();
            if (id) {
                history.replaceState(null, '', `${location.pathname}${location.search}#${id}`);
            }
        });
        afterNextRender(() => {
            this.observeSections();
            this.scrollToSection(this.active(), 'auto');
        });
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
        this.scrollToSection(id, 'smooth');
    }

    private scrollToSection(id: string, behavior: ScrollBehavior) {
        if (!/^sec-[a-z]+$/.test(id)) {
            return;
        }
        this.host.nativeElement.querySelector(`#${id}`)?.scrollIntoView({ behavior, block: 'start' });
    }

    protected openSettings() {
        this.nav.openSettings();
    }

    protected onDragStart(id: string) {
        this.sectionsStore.dragId.set(id);
    }

    protected onDragOver(event: DragEvent, overId: string) {
        event.preventDefault();
        const from = this.dragId();
        if (from && from !== overId) {
            this.sectionsStore.move(from, overId);
        }
    }

    protected onDrop(event: DragEvent) {
        event.preventDefault();
        this.sectionsStore.persistOrder();
    }

    protected onDragEnd() {
        this.sectionsStore.dragId.set('');
        this.sectionsStore.persistOrder();
    }

    private observeSections() {
        const nodes = this.host.nativeElement.querySelectorAll('section[data-sec]');
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
