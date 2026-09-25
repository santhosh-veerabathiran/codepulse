export enum ChartKind {
    Line = 'line',
    Area = 'area',
    Bar = 'bar',
    Dots = 'dots',
    Step = 'step',
    Donut = 'donut',
    Column = 'column',
}

export interface ChartPoint {
    x: number;
    y: number;
    label: string;
    value: string;
}

export interface ChartTipRow {
    label: string;
    value: string;
    color: string;
    active?: boolean;
}

export interface ChartTip {
    xPct: number;
    title: string;
    rows: ChartTipRow[];
}
