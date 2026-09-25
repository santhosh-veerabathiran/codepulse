export interface RawCommit {
    date: string;
    authorKey: string;
    authorName: string;
    repo: string;
    add: number;
    del: number;
    cats?: number[];
    type: string;
    merge: boolean;
    sha: string;
    title: string;
}

export interface RawMr {
    created: string;
    merged: string;
    authorKey: string;
    authorName: string;
    repo: string;
    state: number;
    mergerKey: string;
    ttm: number;
}
