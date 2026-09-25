import { COMP_MAP, RANK_MAP, TREND_MAP } from '../constants';
import { ChartKind } from '../types';

export const mapTrendKind = (name: string): ChartKind => {
    return TREND_MAP[name] ?? ChartKind.Area;
};

export const mapCompKind = (name: string): ChartKind => {
    return COMP_MAP[name] ?? ChartKind.Donut;
};

export const mapRankKind = (name: string): ChartKind => {
    return RANK_MAP[name] ?? ChartKind.Bar;
};
