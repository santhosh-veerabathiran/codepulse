export enum PeriodKind {
    All = 'all',
    Year = 'year',
    Range = 'range',
    Rolling = 'rolling',
}

export interface Period {
    kind: PeriodKind;
    year?: string;
    from?: string;
    to?: string;
    days?: number;
    preset?: string;
}

export enum LineCat {
    All = 'all',
    Code = 'code',
    CodeWithComments = 'code_wc',
    CodeNoComments = 'code_nc',
    Comments = 'comments',
    CommentsNet = 'comments_net',
    Test = 'test',
    Docs = 'docs',
    Config = 'config',
    Deps = 'deps',
    Gen = 'gen',
}

export enum GranKind {
    Auto = 'auto',
    Day = 'day',
    Week = 'week',
    Month = 'month',
    Year = 'year',
}
