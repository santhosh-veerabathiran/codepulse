import { ChartKind } from '../types';

export const TREND_MAP: Record<string, ChartKind> = { area: ChartKind.Area, line: ChartKind.Line, step: ChartKind.Step, bars: ChartKind.Bar, bar: ChartKind.Bar, dots: ChartKind.Dots };
export const COMP_MAP: Record<string, ChartKind> = { donut: ChartKind.Donut, column: ChartKind.Column, hbar: ChartKind.Bar, bar: ChartKind.Bar };
export const RANK_MAP: Record<string, ChartKind> = { lollipop: ChartKind.Dots, dot: ChartKind.Dots, dots: ChartKind.Dots, bar: ChartKind.Bar, column: ChartKind.Bar };
