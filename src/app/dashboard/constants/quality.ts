export const QUALITY_CATEGORIES: { key: string; label: string; color: string }[] = [
    { key: 'code', label: 'Code', color: 'var(--s1)' },
    { key: 'test', label: 'Tests', color: 'var(--s4)' },
    { key: 'docs', label: 'Docs', color: 'var(--s3)' },
    { key: 'config', label: 'Config', color: 'var(--s8)' },
    { key: 'deps', label: 'Dependencies', color: 'var(--s5)' },
    { key: 'gen', label: 'Generated', color: 'var(--s7)' },
];

export const SIZE_BUCKETS: { label: string; max: number }[] = [
    { label: '1–10', max: 10 },
    { label: '11–50', max: 50 },
    { label: '51–200', max: 200 },
    { label: '201–1k', max: 1000 },
    { label: '1k+', max: Infinity },
];
