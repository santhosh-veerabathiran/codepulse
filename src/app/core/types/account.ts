export enum SourceKind {
    Json = 'json',
    GitHub = 'github',
    GitLab = 'gitlab',
}

export interface Account {
    id: string;
    kind: SourceKind;
    label: string;
    host?: string;
    username?: string;
    token?: string;
    repos?: string[];
    createdAt: number;
    dataAt?: number;
    sourceName?: string;
}

export interface StoredDataset {
    id: string;
    facts: unknown;
    at: number;
}
