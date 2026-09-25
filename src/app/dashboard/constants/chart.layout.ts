import { SeriesChart } from '../types';

export const TREND_LAYOUT = { w: 900, h: 280, ml: 40, mr: 14, mt: 14, mb: 28 };
export const PULSE_LAYOUT = { w: 900, h: 220, ml: 42, mr: 14, mt: 14, mb: 26 };
export const EMPTY_SERIES: SeriesChart = { empty: true, line: '', area: '', step: '', bars: [], dots: [], yTicks: [], xTicks: [], points: [] };
