export interface TypeRow {
    label: string;
    metric: number;
    percent: number;
    detail: string;
}

export interface ScopeRow {
    name: string;
    percent: number;
    detail: string;
}

export interface Tier {
    key: string;
    badge: string;
    badgeClass: string;
    rows: ScopeRow[];
}
