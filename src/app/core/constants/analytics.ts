import { Agg, Cell, CompareGroup, MetricKind, SortDef } from '../types';
import { format, formatCompact, formatDuration, percent } from '../utils/format';

const catTotal = (a: Agg): number => {
    return (
        Object.values(a.categories).reduce((x, y) => {
            return x + y;
        }, 0) || 1
    );
};

export const SORTS: SortDef[] = [
    {
        key: 'commits',
        label: 'Commits (authored)',
        group: 'Output',
        format: format,
        value: (a) => {
            return a.commits;
        },
    },
    {
        key: 'code',
        label: 'Code lines',
        group: 'Output',
        format: formatCompact,
        value: (a) => {
            return a.categories['code'] || 0;
        },
    },
    {
        key: 'lines',
        label: 'Total lines changed',
        group: 'Output',
        format: formatCompact,
        value: (a) => {
            return a.additions + a.deletions;
        },
    },
    {
        key: 'net_lines',
        label: 'Net lines (added − deleted)',
        group: 'Output',
        format: formatCompact,
        value: (a) => {
            return a.additions - a.deletions;
        },
    },
    {
        key: 'mr_merged',
        label: 'Merge requests merged',
        group: 'Output',
        format: format,
        value: (a) => {
            return a.mergeRequests.merged;
        },
    },
    {
        key: 'mr_opened',
        label: 'Merge requests opened',
        group: 'Output',
        format: format,
        value: (a) => {
            return a.mergeRequests.authored;
        },
    },
    {
        key: 'merges',
        label: 'Merges into main',
        group: 'Output',
        format: format,
        value: (a) => {
            return a.merges.toMain;
        },
    },
    {
        key: 'merges_back',
        label: 'Main → branch merges',
        group: 'Output',
        format: format,
        value: (a) => {
            return a.merges.toBranch;
        },
    },
    {
        key: 'comment_lines',
        label: 'Comment lines added',
        group: 'Output',
        format: formatCompact,
        value: (a) => {
            return a.commentAdd;
        },
    },
    {
        key: 'active_days',
        label: 'Active days',
        group: 'Cadence',
        format: format,
        value: (a) => {
            return a.days;
        },
    },
    {
        key: 'commits_per_day',
        label: 'Commits / active day',
        group: 'Cadence',
        format: (v) => {
            return v.toFixed(1);
        },
        gate: (a) => {
            return a.days >= 5;
        },
        value: (a) => {
            return a.days ? a.commits / a.days : 0;
        },
    },
    {
        key: 'code_per_day',
        label: 'Code lines / active day',
        group: 'Cadence',
        format: formatCompact,
        gate: (a) => {
            return a.days >= 5;
        },
        value: (a) => {
            return a.days ? (a.categories['code'] || 0) / a.days : 0;
        },
    },
    {
        key: 'lines_per_day',
        label: 'Lines / active day',
        group: 'Cadence',
        format: formatCompact,
        gate: (a) => {
            return a.days >= 5;
        },
        value: (a) => {
            return a.days ? (a.additions + a.deletions) / a.days : 0;
        },
    },
    {
        key: 'avg_size',
        label: 'Mean commit size',
        group: 'Code craft',
        format: (v) => {
            return `${format(v)} ln`;
        },
        gate: (a) => {
            return a.commits >= 20;
        },
        value: (a) => {
            return a.sizes.mean;
        },
    },
    {
        key: 'reviews',
        label: 'MRs reviewed for others',
        group: 'Merge quality',
        format: format,
        value: (a) => {
            return a.mergeRequests.reviewed;
        },
    },
    {
        key: 'merge_rate',
        label: 'Merge rate (% accepted)',
        group: 'Merge quality',
        format: (v) => {
            return `${v.toFixed(0)}%`;
        },
        gate: (a) => {
            return a.mergeRequests.merged + a.mergeRequests.closed >= 10;
        },
        value: (a) => {
            return a.mergeRequests.rate || 0;
        },
    },
    {
        key: 'code_pct',
        label: 'Code % of lines changed',
        group: 'Composition',
        format: (v) => {
            return `${v.toFixed(0)}%`;
        },
        gate: (a) => {
            return a.lineSum >= 2000;
        },
        value: (a) => {
            return percent(a.categories['code'] || 0, catTotal(a));
        },
    },
];

export const sortByKey = (key: string): SortDef => {
    return (
        SORTS.find((s) => {
            return s.key === key;
        }) || SORTS[0]
    );
};

const catTot = (c: Cell): number => {
    return (
        Object.values(c.categories).reduce((x, y) => {
            return x + y;
        }, 0) || 1
    );
};

const fCount = (v: number): string => {
    return format(v);
};

const fLines = (v: number): string => {
    return formatCompact(v);
};

const fPct = (v: number): string => {
    return `${(v || 0).toFixed(1)}%`;
};

const fRate = (v: number): string => {
    return (v || 0).toFixed(1);
};

const fSize = (v: number): string => {
    return `${format(v)} ln`;
};

const fDays = (v: number): string => {
    return `${format(v)} d`;
};

const fDur = (v: number): string => {
    return formatDuration(v);
};

const smallShare = (c: Cell): number => {
    if (!c.sizeList.length) {
        return 0;
    }
    const small = c.sizeList.filter((s) => {
        return s <= 10;
    }).length;
    return percent(small, c.sizeList.length);
};

const fastShare = (c: Cell): number => {
    if (!c.mergeRequests.timeToMergeList.length) {
        return 0;
    }
    const fast = c.mergeRequests.timeToMergeList.filter((t) => {
        return t < 4;
    }).length;
    return percent(fast, c.mergeRequests.timeToMergeList.length);
};

export const COMPARE_GROUPS: CompareGroup[] = [
    {
        name: 'Output & activity',
        kind: MetricKind.Output,
        metrics: [
            {
                label: 'Authored commits',
                format: fCount,
                value: (c) => {
                    return c.commits;
                },
            },
            {
                label: 'Merges into main',
                format: fCount,
                value: (c) => {
                    return c.merges.toMain;
                },
            },
            {
                label: 'Main → branch merges',
                format: fCount,
                value: (c) => {
                    return c.merges.toBranch;
                },
            },
            {
                label: 'MRs merged',
                format: fCount,
                value: (c) => {
                    return c.mergeRequests.merged;
                },
            },
            {
                label: 'MRs opened',
                format: fCount,
                value: (c) => {
                    return c.mergeRequests.authored;
                },
            },
            {
                label: 'MRs closed unmerged',
                format: fCount,
                value: (c) => {
                    return c.mergeRequests.closed;
                },
            },
            {
                label: 'Net lines (add − del)',
                format: fLines,
                value: (c) => {
                    return c.additions - c.deletions;
                },
            },
            {
                label: 'Active days',
                format: fDays,
                value: (c) => {
                    return c.days;
                },
            },
            {
                label: 'Commits / active day',
                format: fRate,
                value: (c) => {
                    return c.days ? c.commits / c.days : 0;
                },
            },
        ],
    },
    {
        name: 'Volume — lines by category',
        kind: MetricKind.Output,
        metrics: [
            {
                label: 'Total lines changed',
                format: fLines,
                value: (c) => {
                    return c.additions + c.deletions;
                },
            },
            {
                label: 'Code',
                format: fLines,
                value: (c) => {
                    return c.categories['code'] || 0;
                },
            },
            {
                label: 'Comment lines',
                format: fLines,
                value: (c) => {
                    return c.commentAdd;
                },
            },
            {
                label: 'Tests',
                format: fLines,
                value: (c) => {
                    return c.categories['test'] || 0;
                },
            },
            {
                label: 'Docs',
                format: fLines,
                value: (c) => {
                    return c.categories['docs'] || 0;
                },
            },
        ],
    },
    {
        name: 'Composition — share of own work',
        kind: MetricKind.Craft,
        metrics: [
            {
                label: 'Code %',
                format: fPct,
                value: (c) => {
                    return percent(c.categories['code'] || 0, catTot(c));
                },
            },
            {
                label: 'Comment-line ratio',
                format: fPct,
                value: (c) => {
                    return percent(c.commentAdd, c.commentAdd + c.codeAdd);
                },
            },
            {
                label: 'Tests %',
                format: fPct,
                value: (c) => {
                    return percent(c.categories['test'] || 0, catTot(c));
                },
            },
            {
                label: 'Test-to-code ratio',
                format: fPct,
                value: (c) => {
                    return percent(c.categories['test'] || 0, (c.categories['test'] || 0) + (c.categories['code'] || 0));
                },
            },
        ],
    },
    {
        name: 'Craft — commit shape',
        kind: MetricKind.Craft,
        metrics: [
            {
                label: 'Median commit size',
                format: fSize,
                value: (c) => {
                    return c.sizes.median;
                },
            },
            {
                label: 'Mean commit size',
                format: fSize,
                value: (c) => {
                    return c.sizes.mean;
                },
            },
            {
                label: 'P90 commit size',
                format: fSize,
                value: (c) => {
                    return c.sizes.p90;
                },
            },
            {
                label: 'Code lines / commit',
                format: fRate,
                value: (c) => {
                    return c.commits ? (c.categories['code'] || 0) / c.commits : 0;
                },
            },
            { label: 'Small commits ≤10 ln', format: fPct, lower: true, value: smallShare },
        ],
    },
    {
        name: 'Merge quality',
        kind: MetricKind.Craft,
        metrics: [
            {
                label: 'Merge rate',
                format: fPct,
                value: (c) => {
                    return c.mergeRequests.rate || 0;
                },
            },
            {
                label: 'Median time-to-merge',
                format: fDur,
                lower: true,
                value: (c) => {
                    return c.mergeRequests.timeToMerge || 0;
                },
            },
            { label: 'Fast merges (<4h)', format: fPct, value: fastShare },
            {
                label: 'Review comments / MR',
                format: fCount,
                value: (c) => {
                    return c.mergeRequests.noteCount || 0;
                },
            },
            {
                label: 'Self-merge rate',
                format: fPct,
                lower: true,
                value: (c) => {
                    return c.mergeRequests.merged ? percent(c.mergeRequests.selfMerged, c.mergeRequests.merged) : 0;
                },
            },
            {
                label: 'MRs reviewed for others',
                format: fCount,
                value: (c) => {
                    return c.mergeRequests.reviewed;
                },
            },
        ],
    },
];
