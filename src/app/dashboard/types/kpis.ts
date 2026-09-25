export interface Delta {
    text: string;
    cls: string;
}

export interface KpiCard {
    label: string;
    raw: number;
    fmt: (value: number) => string;
    sub: string;
    color: string;
    icon: string;
    spark: string;
    sparkArea: string;
    delta?: Delta;
}

export interface KpiSpec {
    label: string;
    raw: number;
    fmt: (value: number) => string;
    sub: string;
    color: string;
    icon: string;
    idx: number;
}
