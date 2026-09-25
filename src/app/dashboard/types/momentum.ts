import { Delta } from './kpis';

export interface MomentumRow {
    year: string;
    value: string;
    sub: string;
    percent: number;
    delta?: Delta;
}
