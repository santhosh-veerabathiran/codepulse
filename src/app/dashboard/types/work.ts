export interface TypeRow {
    label: string;
    count: number;
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
