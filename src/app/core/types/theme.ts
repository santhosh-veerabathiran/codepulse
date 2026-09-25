export interface ThemeOption {
    slug: string;
    name: string;
}

export interface ThemeTokens {
    app?: string;
    surface?: string;
    surface2?: string;
    raise?: string;
    ink?: string;
    ink2?: string;
    muted?: string;
    line?: string;
    line2?: string;
    track?: string;
    accent?: string;
    accentInk?: string;
    accentSoft?: string;
    accentLine?: string;
    glass?: string;
    glassBorder?: string;
    glassSheen?: string;
    good?: string;
    warn?: string;
    bad?: string;
    radius?: string;
    blur?: string;
    mesh?: string;
    meshOpacity?: number;
    shadow1?: string;
    shadow2?: string;
    accentItalic?: string;
    series?: string[];
    gradient?: string[];
}

export interface ThemePattern {
    image?: string;
    size?: string;
    opacity?: number;
}

export interface ThemeFonts {
    sans?: string;
    display?: string;
    mono?: string;
}

export interface ThemeCharts {
    trend: string;
    composition: string;
    ranking: string;
}

export interface ThemeFile {
    name?: string;
    mode?: string;
    tokens?: ThemeTokens;
    pattern?: ThemePattern;
    fonts?: ThemeFonts;
    iconStroke?: number;
    charts?: ThemeCharts;
}
