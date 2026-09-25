import { ChartPoint } from './chart';

export interface PulseKpi {
    label: string;
    value: string;
}

export interface PulseBar {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface Dot {
    x: number;
    y: number;
}

export interface Tick {
    x?: number;
    y?: number;
    label: string;
}

export interface SeriesChart {
    empty: boolean;
    line: string;
    area: string;
    step: string;
    bars: PulseBar[];
    dots: Dot[];
    yTicks: Tick[];
    xTicks: Tick[];
    points: ChartPoint[];
}
