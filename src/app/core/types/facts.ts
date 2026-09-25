export enum F {
    Date,
    Person,
    Repo,
    Type,
    App,
    Add,
    Del,
    Code,
    Test,
    Docs,
    Config,
    Deps,
    Gen,
    CmtAdd,
    CodeAdd,
    Big,
    CmtDel,
    CodeDel,
}

export enum AF {
    Date,
    Person,
    Repo,
    App,
    Lines,
}

export enum MG {
    Date,
    Person,
    Repo,
    Kind,
}

export enum MR {
    Created,
    Merged,
    Author,
    Repo,
    State,
    Notes,
    Ttm,
    Up,
    Merger,
    Mm,
}

export enum MrState {
    Merged,
    Closed,
    Opened,
    Other,
}

export type FactRow = [string, ...number[]];
export type AppRow = [string, number, number, number, number];
export type MergeRow = [string, number, number, number];
export type MrRow = [string, string, number, number, number, number, number, number, number, number];

export interface Person {
    name: string;
    gh: string | null;
    aliases: string[];
    repos: string[];
}

export interface Roster {
    i: number;
    name: string;
    c: number;
}

export interface Grand {
    commits: number;
    lines: number;
    code: number;
    cmt: number;
    cadd: number;
    merges: number;
    mrs: number;
    contributors: number;
}

export interface Facts {
    repos: string[];
    types: string[];
    scopes: string[];
    apps: string[];
    appKind: string[];
    persons: Person[];
    roster: Roster[];
    me: number;
    years: string[];
    grand: Grand;
    F: FactRow[];
    CM: [string, string][];
    MG: MergeRow[];
    MR: MrRow[];
    MM: [string, number][];
    AF: AppRow[];
    bigmin: number;
    repoGroups?: Record<string, string>;
    commitUrl?: string;
}

export const ALL = 'ALL';
export type PersonId = number | typeof ALL;
