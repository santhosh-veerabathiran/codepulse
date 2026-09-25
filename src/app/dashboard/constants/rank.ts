import { format, formatCompact } from '../../core';
import { RankBucketDim, RankMetric } from '../types';

// Bucket tuple layout (year / byrepo / trend-series all share it):
// [0 commits, 1 lines, 2 code, 3 mergesToMain, 4 mergesToBranch, 5 mrsMerged,
//  6 mrsClosed, 7 mrsOpened, 8 reviews, 9 activeDays, 10 net(add-del), 11 comment]
const B = {
    commits: 0,
    lines: 1,
    code: 2,
    mergesMain: 3,
    mergesBranch: 4,
    mrMerged: 5,
    mrClosed: 6,
    mrOpened: 7,
    reviews: 8,
    activeDays: 9,
    net: 10,
    comment: 11,
};

const pct = (value: number): string => {
    return `${value.toFixed(0)}%`;
};
const rate = (value: number): string => {
    return value.toFixed(1);
};
const size = (value: number): string => {
    return `${format(Math.round(value))} ln`;
};
const perDay = (numerator: (b: number[]) => number) => {
    return (b: number[]): number => {
        return b[B.activeDays] ? numerator(b) / b[B.activeDays] : 0;
    };
};

// Every "Rank by" sort key maps 1:1 to a dimension that COMPUTES its value from the
// bucket tuple — counts, line sums, per-day rates and percentages all resolve to the
// same metric they mean, never a commits fallback.
const METRIC_BY_SORT: Record<string, RankMetric> = {
    commits: RankMetric.Commits,
    code: RankMetric.Code,
    lines: RankMetric.Lines,
    net_lines: RankMetric.NetLines,
    comment_lines: RankMetric.CommentLines,
    merges: RankMetric.MergesToMain,
    merges_back: RankMetric.MergesToBranch,
    mr_merged: RankMetric.MrsMerged,
    mr_opened: RankMetric.MrsOpened,
    reviews: RankMetric.Reviews,
    active_days: RankMetric.ActiveDays,
    commits_per_day: RankMetric.CommitsPerDay,
    code_per_day: RankMetric.CodePerDay,
    lines_per_day: RankMetric.LinesPerDay,
    avg_size: RankMetric.AvgSize,
    merge_rate: RankMetric.MergeRate,
    code_pct: RankMetric.CodePct,
};

export const rankMetricFor = (sortKey: string): RankMetric => {
    return METRIC_BY_SORT[sortKey] ?? RankMetric.Commits;
};

export const SERIES_DIMS: RankBucketDim[] = [
    { metric: RankMetric.Commits, label: 'commits', format, value: (b) => b[B.commits] },
    { metric: RankMetric.Lines, label: 'lines changed', format: formatCompact, value: (b) => b[B.lines] },
    { metric: RankMetric.Code, label: 'code lines', format: formatCompact, value: (b) => b[B.code] },
    { metric: RankMetric.NetLines, label: 'net lines', format: formatCompact, value: (b) => b[B.net] },
    { metric: RankMetric.CommentLines, label: 'comment lines', format: formatCompact, value: (b) => b[B.comment] },
    { metric: RankMetric.MergesToMain, label: 'merges into main', format, value: (b) => b[B.mergesMain] },
    { metric: RankMetric.MergesToBranch, label: 'main → branch merges', format, value: (b) => b[B.mergesBranch] },
    { metric: RankMetric.MrsMerged, label: 'MRs merged', format, value: (b) => b[B.mrMerged] },
    { metric: RankMetric.MrsOpened, label: 'MRs opened', format, value: (b) => b[B.mrOpened] },
    { metric: RankMetric.Reviews, label: 'MRs reviewed', format, value: (b) => b[B.reviews] },
    { metric: RankMetric.ActiveDays, label: 'active days', format, value: (b) => b[B.activeDays] },
    { metric: RankMetric.CommitsPerDay, label: 'commits / day', format: rate, derived: true, value: perDay((b) => b[B.commits]) },
    { metric: RankMetric.CodePerDay, label: 'code lines / day', format: formatCompact, derived: true, value: perDay((b) => b[B.code]) },
    { metric: RankMetric.LinesPerDay, label: 'lines / day', format: formatCompact, derived: true, value: perDay((b) => b[B.lines]) },
    { metric: RankMetric.AvgSize, label: 'mean commit size', format: size, derived: true, value: (b) => (b[B.commits] ? b[B.lines] / b[B.commits] : 0) },
    { metric: RankMetric.MergeRate, label: 'merge rate', format: pct, derived: true, value: (b) => (b[B.mrMerged] + b[B.mrClosed] ? (100 * b[B.mrMerged]) / (b[B.mrMerged] + b[B.mrClosed]) : 0) },
    { metric: RankMetric.CodePct, label: 'code %', format: pct, derived: true, value: (b) => (b[B.lines] ? (100 * b[B.code]) / b[B.lines] : 0) },
];

// commit-type tuples carry only [count, lines]; metrics with no per-type meaning
// resolve to commits — the honest unit of a type breakdown.
export const TYPE_DIMS: RankBucketDim[] = [
    { metric: RankMetric.Commits, label: 'commits', format, value: (b) => b[0] },
    { metric: RankMetric.Lines, label: 'lines', format: formatCompact, value: (b) => b[1] },
];

export const resolveDim = (sortKey: string, dims: RankBucketDim[]): RankBucketDim => {
    const metric = rankMetricFor(sortKey);
    return (
        dims.find((d) => {
            return d.metric === metric;
        }) ?? dims[0]
    );
};
