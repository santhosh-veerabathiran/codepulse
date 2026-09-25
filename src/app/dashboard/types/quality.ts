export interface CategoryItem {
    key: string;
    label: string;
    color: string;
    value: number;
    lines: string;
    percent: number;
    pctText: string;
    colH: number;
}

export interface Composition {
    gradient: string;
    total: string;
}

export interface Split {
    codeW: number;
    cmtW: number;
    codeText: string;
    cmtText: string;
    ratio: string;
}

export interface SizeCard {
    label: string;
    value: string;
    note: string;
}

export interface DistRow {
    label: string;
    count: number;
    w: number;
}

export interface BigRow {
    date: string;
    kindShow: boolean;
    kind: string;
    scope: string;
    title: string;
    sha: string;
    url: string;
    lines: string;
    repo: string;
}
