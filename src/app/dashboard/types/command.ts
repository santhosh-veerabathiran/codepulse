export interface Command {
    label: string;
    hint: string;
    run: () => void;
}
