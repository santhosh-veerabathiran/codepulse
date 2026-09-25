import { Cell } from '../../core';

export interface ComparePerson {
    id: number;
    name: string;
    color: string;
    cell: Cell;
}

export interface CmpCell {
    text: string;
    percent: number;
    color: string;
    win: boolean;
    mark: string;
}

export interface CmpRow {
    label: string;
    cells: CmpCell[];
}

export interface CmpBlock {
    name: string;
    craft: boolean;
    tag: string;
    rows: CmpRow[];
}

export interface Standing {
    id: number;
    name: string;
    color: string;
    craft: number;
    output: number;
    total: number;
}

export interface RadarModel {
    grid: string[];
    axes: { x1: number; y1: number; x2: number; y2: number }[];
    labels: { x: number; y: number; text: string; anchor: string }[];
    polys: { points: string; color: string }[];
}
