import { TrendMetric } from '../types';

export const DEFAULT_TREND_METRIC: TrendMetric = { index: 0, label: 'Commits' };

export const TREND_METRIC: Record<string, TrendMetric> = {
    commits: { index: 0, label: 'Commits' },
    active_days: { index: 0, label: 'Commits' },
    commits_per_day: { index: 0, label: 'Commits' },
    avg_size: { index: 0, label: 'Commits' },
    code: { index: 2, label: 'Code lines' },
    code_per_day: { index: 2, label: 'Code lines' },
    code_pct: { index: 2, label: 'Code lines' },
    lines: { index: 1, label: 'Lines changed' },
    net_lines: { index: 1, label: 'Lines changed' },
    lines_per_day: { index: 1, label: 'Lines changed' },
    comment_lines: { index: 1, label: 'Lines changed' },
    mr_merged: { index: 4, label: 'MRs merged' },
    mr_opened: { index: 4, label: 'MRs merged' },
    merge_rate: { index: 4, label: 'MRs merged' },
    reviews: { index: 4, label: 'MRs merged' },
    merges: { index: 3, label: 'Merges' },
    merges_back: { index: 3, label: 'Merges' },
};
