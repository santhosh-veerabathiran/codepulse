export interface MrKpi {
    label: string;
    value: string;
    note: string;
    hot: boolean;
}

export interface Seg {
    w: number;
    color: string;
    label: string;
    value: number;
}

export interface YearRow {
    year: string;
    segs: Seg[];
    summary: string;
}
