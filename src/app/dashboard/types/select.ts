export interface SelectOption {
    value: string;
    label: string;
    hint?: string;
    group?: string;
}

export interface OptionGroup {
    name: string;
    options: SelectOption[];
}
