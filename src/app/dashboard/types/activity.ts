export interface CalCell {
    date: string;
    count: number;
    bg: string;
    title: string;
}

export interface Calendar {
    weeks: CalCell[][];
    hasData: boolean;
}

export interface DowBar {
    label: string;
    name: string;
    height: number;
    count: number;
}

export interface Stat {
    label: string;
    value: string;
}
