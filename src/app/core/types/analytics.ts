export interface Sizes {
    median: number;
    mean: number;
    p75: number;
    p90: number;
}

export interface BigCommit {
    lines: number;
    date: string;
    kind: string;
    scope: string;
    title: string;
    sha: string;
    repo: string;
}

export interface MrStats {
    authored: number;
    merged: number;
    closed: number;
    open: number;
    upvotes: number;
    reviewed: number;
    selfMerged: number;
    timeToMergeList: number[];
    noteCountList: number[];
    timeToMerge?: number;
    noteCount: number;
    rate?: number;
}

export interface Merges {
    count: number;
    toMain: number;
    toBranch: number;
}

export interface Agg {
    id: number;
    commits: number;
    additions: number;
    deletions: number;
    commentAdd: number;
    codeAdd: number;
    commentDel: number;
    lineSum: number;
    categories: Record<string, number>;
    days: number;
    sizes: Sizes;
    merges: Merges;
    mergeRequests: MrStats;
}

export interface Cell extends Agg {
    year: Record<string, number[]>;
    month: Record<string, number[]>;
    types: Record<string, number[]>;
    scopes: Record<string, [number, number]>;
    byrepo: Record<string, number[]>;
    daily: Record<string, number>;
    dow: number[];
    range: [string, string];
    series: SeriesData;
    sizeList: number[];
    mrYear: Record<string, number[]>;
    largest: BigCommit[];
}

export interface SeriesData {
    gran: string;
    keys: string[];
    data: Record<string, number[]>;
}

export interface OwnEntry {
    total: number;
    by: Record<number, number>;
}

export interface OwnContrib {
    id: number;
    name: string;
    lines: number;
    share: number;
}

export interface OwnRow {
    name: string;
    lib: boolean;
    total: number;
    percent: number;
    color: string;
    right: string;
    fragile: boolean;
    contribs: OwnContrib[];
}

export interface RankRow {
    id: number;
    name: string;
    value: number;
    agg: Agg;
}

export interface SortDef {
    key: string;
    label: string;
    group: string;
    format: (value: number) => string;
    value: (a: Agg) => number;
    gate?: (a: Agg) => boolean;
}

export enum MetricKind {
    Craft = 'craft',
    Output = 'output',
}

export interface CompareMetric {
    label: string;
    lower?: boolean;
    format: (value: number) => string;
    value: (cell: Cell) => number;
}

export interface CompareGroup {
    name: string;
    kind: MetricKind;
    metrics: CompareMetric[];
}
