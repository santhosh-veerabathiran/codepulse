import { Injectable, signal } from '@angular/core';
import { DEFAULT_THEME_SLUG, THEME_KEY } from '../constants';
import { DEFAULT_CHARTS, TOKEN_VARS } from '../constants/theme';
import { ThemeCharts, ThemeFile, ThemeOption } from '../types';

@Injectable({ providedIn: 'root' })
export class ThemeStore {
    readonly themes: readonly ThemeOption[] = [
        { slug: 'aurora', name: 'Aurora' },
        { slug: 'blueprint', name: 'Blueprint' },
        { slug: 'forest', name: 'Forest' },
        { slug: 'paper', name: 'Paper' },
        { slug: 'pop', name: 'Pop' },
        { slug: 'vapor', name: 'Vapor' },
    ];

    readonly current = signal<string>(this.readStored());
    readonly charts = signal<ThemeCharts>(DEFAULT_CHARTS);

    constructor() {
        void this.apply(this.current());
    }

    async apply(slug: string) {
        try {
            const theme = (await fetch(`assets/themes/${slug}.json`).then((r) => {
                return r.json();
            })) as ThemeFile;
            this.paint(theme);
            this.charts.set(theme.charts ?? DEFAULT_CHARTS);
            this.current.set(slug);
            this.persist(slug);
        } catch {
            /* keep the :root defaults from styles.scss */
        }
    }

    private paint(theme: ThemeFile) {
        const root = document.documentElement.style;
        const tokens = theme.tokens;
        if (tokens) {
            for (const key of Object.keys(TOKEN_VARS)) {
                const value = (tokens as Record<string, unknown>)[key];
                if (value !== undefined && value !== null) {
                    root.setProperty(TOKEN_VARS[key], String(value));
                }
            }
            if (tokens.meshOpacity !== undefined) {
                root.setProperty('--mesh-op', String(tokens.meshOpacity));
            }
            if (tokens.series) {
                tokens.series.forEach((color, i) => {
                    if (i < 8) {
                        root.setProperty(`--s${i + 1}`, color);
                    }
                });
            }
            if (tokens.gradient && tokens.gradient.length >= 2) {
                root.setProperty('--grad', `linear-gradient(135deg, ${tokens.gradient[0]}, ${tokens.gradient[1]})`);
            }
        }
        const fonts = theme.fonts;
        if (fonts) {
            if (fonts.sans) {
                root.setProperty('--font', fonts.sans);
            }
            if (fonts.display) {
                root.setProperty('--font-d', fonts.display);
            }
            if (fonts.mono) {
                root.setProperty('--mono', fonts.mono);
            }
        }
        if (theme.iconStroke !== undefined) {
            root.setProperty('--icon-stroke', String(theme.iconStroke));
        }
        const pattern = theme.pattern;
        if (pattern) {
            if (pattern.image !== undefined) {
                root.setProperty('--pattern', pattern.image);
            }
            if (pattern.size !== undefined) {
                root.setProperty('--pattern-size', pattern.size);
            }
            if (pattern.opacity !== undefined) {
                root.setProperty('--pattern-op', String(pattern.opacity));
            }
        }
    }

    private readStored(): string {
        try {
            return localStorage.getItem(THEME_KEY) ?? DEFAULT_THEME_SLUG;
        } catch {
            return DEFAULT_THEME_SLUG;
        }
    }

    private persist(slug: string) {
        try {
            localStorage.setItem(THEME_KEY, slug);
        } catch {
            /* storage unavailable (private mode) */
        }
    }
}
