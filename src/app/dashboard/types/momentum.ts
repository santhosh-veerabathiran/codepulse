import { Delta } from './kpis';

export interface MomentumRow {
    year: string;
    value: string;
    lines: string;
    percent: number;
    delta?: Delta;
}
