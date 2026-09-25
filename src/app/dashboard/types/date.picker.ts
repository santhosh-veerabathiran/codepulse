export interface DayCell {
    iso: string;
    day: number;
    selected: boolean;
    today: boolean;
    disabled: boolean;
    blank: boolean;
}

export interface ViewMonth {
    y: number;
    m: number;
}
