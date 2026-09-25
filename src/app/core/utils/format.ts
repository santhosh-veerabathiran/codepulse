export const format = (value: number): string => {
    return Math.round(value || 0).toLocaleString('en-US');
};

export const formatCompact = (value: number): string => {
    const n = value || 0;
    const abs = Math.abs(n);
    if (abs >= 1_000_000) {
        return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    }
    if (abs >= 1000) {
        return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
    }
    return String(Math.round(n));
};

export const formatDuration = (hours?: number): string => {
    if (hours == null) {
        return '—';
    }
    if (hours < 1) {
        return `${Math.round(hours * 60)}m`;
    }
    if (hours < 48) {
        return `${hours.toFixed(1).replace(/\.0$/, '')}h`;
    }
    return `${Math.round(hours / 24)}d`;
};

export const percent = (n: number, d: number): number => {
    return d ? (100 * n) / d : 0;
};
