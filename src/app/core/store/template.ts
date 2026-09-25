import { Injectable, signal } from '@angular/core';
import { DEFAULT_TEMPLATE_SLUG, TEMPLATE_KEY } from '../constants';
import { TemplateOption } from '../types';

@Injectable({ providedIn: 'root' })
export class TemplateStore {
    readonly templates: readonly TemplateOption[] = [
        { slug: 'classic', name: 'Classic', tagline: 'Focused rail · vertical flow', defaultTheme: 'aurora' },
        { slug: 'terminal', name: 'Terminal', tagline: 'Monospace · dense grid', defaultTheme: 'blueprint' },
        { slug: 'studio', name: 'Studio', tagline: 'Glass bento · ambient glow', defaultTheme: 'vapor' },
        { slug: 'editorial', name: 'Editorial', tagline: 'Light · big display type', defaultTheme: 'paper' },
        { slug: 'console', name: 'Console', tagline: 'Sidebar · widget grid', defaultTheme: 'pop' },
    ];

    readonly current = signal<string>(this.readStored());

    apply(slug: string) {
        const valid = this.isKnown(slug) ? slug : DEFAULT_TEMPLATE_SLUG;
        this.current.set(valid);
        this.reflect(valid);
        this.persist(valid);
    }

    defaultThemeFor(slug: string): string {
        return (
            this.templates.find((t) => {
                return t.slug === slug;
            })?.defaultTheme ?? 'aurora'
        );
    }

    private isKnown(slug: string): boolean {
        return this.templates.some((t) => {
            return t.slug === slug;
        });
    }

    private reflect(slug: string) {
        document.documentElement.setAttribute('data-template', slug);
    }

    private readStored(): string {
        try {
            const slug = localStorage.getItem(TEMPLATE_KEY) ?? DEFAULT_TEMPLATE_SLUG;
            return this.isKnown(slug) ? slug : DEFAULT_TEMPLATE_SLUG;
        } catch {
            return DEFAULT_TEMPLATE_SLUG;
        }
    }

    private persist(slug: string) {
        try {
            localStorage.setItem(TEMPLATE_KEY, slug);
        } catch {
            /* storage unavailable (private mode) */
        }
    }
}
