import { ChartPoint } from './chart';

export interface TrendBar {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface TrendChart {
    empty: boolean;
    line: string;
    area: string;
    step: string;
    bars: TrendBar[];
    yTicks: { y: number; label: string }[];
    xTicks: { x: number; label: string }[];
    dots: { x: number; y: number }[];
    points: ChartPoint[];
}
