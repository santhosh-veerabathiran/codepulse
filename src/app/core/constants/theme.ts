import { ThemeCharts } from '../types';

export const DEFAULT_CHARTS: ThemeCharts = { trend: 'area', composition: 'donut', ranking: 'lollipop' };

export const TOKEN_VARS: Record<string, string> = {
    app: '--app',
    surface: '--surface',
    surface2: '--surface-2',
    raise: '--raise',
    ink: '--ink',
    ink2: '--ink-2',
    muted: '--muted',
    line: '--line',
    line2: '--line-2',
    track: '--track',
    accent: '--acc',
    accentInk: '--acc-ink',
    accentSoft: '--acc-soft',
    accentLine: '--acc-line',
    glass: '--glass',
    glassBorder: '--glass-brd',
    glassSheen: '--glass-sheen',
    good: '--good',
    warn: '--warn',
    bad: '--bad',
    radius: '--radius',
    blur: '--blur',
    mesh: '--mesh',
    shadow1: '--sh-1',
    shadow2: '--sh-2',
    accentItalic: '--accent-italic',
};
