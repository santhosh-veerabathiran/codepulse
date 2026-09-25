export enum RankMetric {
    Commits = 'commits',
    Lines = 'lines',
    Code = 'code',
    NetLines = 'net_lines',
    CommentLines = 'comment_lines',
    MergesToMain = 'merges_to_main',
    MergesToBranch = 'merges_to_branch',
    MrsMerged = 'mrs_merged',
    MrsOpened = 'mrs_opened',
    Reviews = 'reviews',
    ActiveDays = 'active_days',
    CommitsPerDay = 'commits_per_day',
    CodePerDay = 'code_per_day',
    LinesPerDay = 'lines_per_day',
    AvgSize = 'avg_size',
    MergeRate = 'merge_rate',
    CodePct = 'code_pct',
}

export interface RankBucketDim {
    metric: RankMetric;
    label: string;
    format: (value: number) => string;
    value: (bucket: number[]) => number;
    // derived = a rate/percentage, not a raw count — excluded from the trend tooltip list.
    derived?: boolean;
}
