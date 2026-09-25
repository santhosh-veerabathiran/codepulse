import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AnalyticsStore, Cell, ALL, FiltersStore, format, formatDuration, formatCompact, percent } from '../core';
import { Insight } from './types';
import { MONTHS } from './constants';

@Component({
    selector: 'cp-insights',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="head">
            <p class="eyebrow">Signals</p>
            <h2>{{ name() }} — what stands out</h2>
            <p class="sub">Automatic reading of the numbers in the current repo &amp; period.</p>
        </div>

        @if (!cell()) {
            <p class="empty card">No activity to read in this view.</p>
        } @else {
            <div class="card list">
                @for (i of insights(); track i.text) {
                    <div class="row">
                        <span class="ic">{{ i.icon }}</span>
                        <span class="tx">{{ i.text }}</span>
                    </div>
                }
            </div>
        }
    `,
    styles: `
        :host {
            display: block;
        }
        .head {
            margin-bottom: 16px;
        }
        .eyebrow {
            font: 700 10px var(--font);
            letter-spacing: 0.08em;
            color: var(--acc-ink, var(--acc));
            margin: 0 0 3px;
        }
        h2 {
            font: 800 22px var(--font-d, var(--font));
            margin: 0;
            color: var(--ink);
        }
        .sub {
            font-size: 12.5px;
            color: var(--muted);
            margin: 4px 0 0;
        }
        .card {
            background: var(--glass, var(--surface));
            border: 1px solid var(--glass-brd, var(--line));
            border-radius: var(--radius, 14px);
        }
        .list {
            padding: 8px;
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        .row {
            display: grid;
            grid-template-columns: 34px 1fr;
            align-items: center;
            gap: 12px;
            padding: 11px 12px;
            border-radius: 10px;
            transition: background 0.12s;
        }
        .row:hover {
            background: var(--surface-2);
        }
        .ic {
            width: 30px;
            height: 30px;
            display: grid;
            place-items: center;
            border-radius: 9px;
            background: var(--acc-soft);
            color: var(--acc-ink, var(--acc));
            font-size: 14px;
        }
        .tx {
            font: 500 13px var(--font);
            color: var(--ink-2, var(--ink));
            line-height: 1.4;
        }
        .empty {
            padding: 40px;
            text-align: center;
            color: var(--muted);
        }
    `,
})
export class InsightsComponent {
    private readonly analytics = inject(AnalyticsStore);
    private readonly filters = inject(FiltersStore);

    protected readonly cell = this.analytics.selectedCell;
    protected readonly name = computed<string>(() => {
        return this.analytics.personName(this.filters.personId());
    });

    protected readonly insights = computed<Insight[]>(() => {
        const c = this.cell();
        if (!c) {
            return [];
        }
        const out: Insight[] = [];
        const pid = this.filters.personId();
        if (pid === ALL) {
            out.push({ icon: 'Σ', text: this.teamLine(c) });
        } else {
            const ranked = this.analytics.ranked();
            const idx = ranked.findIndex((r) => {
                return r.id === pid;
            });
            if (idx >= 0) {
                out.push({ icon: '#', text: `Ranks #${idx + 1} of ${ranked.length} by the current sort in this view.` });
            }
        }

        const turf = this.topScope(c);
        if (turf) {
            out.push({ icon: '◆', text: turf });
        }

        const peak = this.peakMonth(c);
        if (peak) {
            out.push({ icon: '↗', text: peak });
        }

        const balance = this.featureFix(c);
        if (balance) {
            out.push({ icon: '⚙', text: balance });
        }

        if (c.sizes.median > 0) {
            out.push({ icon: '◇', text: `Typical commit is ${format(c.sizes.median)} lines; mean ${format(c.sizes.mean)} reflects a tail of larger ones.` });
        }

        const review = this.reviewLine(c);
        if (review) {
            out.push({ icon: '↺', text: review });
        }

        const catTot = Object.values(c.categories).reduce((sum, value) => {
            return sum + value;
        }, 0);
        const tests = c.categories['test'] || 0;
        if (tests > 0 && catTot > 0) {
            out.push({ icon: '✓', text: `Tests are ${percent(tests, catTot).toFixed(1)}% of their changed lines.` });
        }

        return out.slice(0, 8);
    });

    private teamLine(c: Cell): string {
        return `${format(c.commits)} commits and ${formatCompact(c.additions + c.deletions)} lines combined across everyone in this view.`;
    }

    private topScope(c: Cell): string | undefined {
        const scopes = Object.entries(c.scopes)
            .map(([scope, pair]) => {
                return [scope, pair[1]] as [string, number];
            })
            .sort((a, b) => {
                return b[1] - a[1];
            });
        if (!scopes.length || scopes[0][1] <= 0) {
            return;
        }
        const second = scopes[1] ? `, ahead of ${scopes[1][0]} (${formatCompact(scopes[1][1])})` : '';
        return `Home turf: ${scopes[0][0]} — ${formatCompact(scopes[0][1])} lines${second}.`;
    }

    private peakMonth(c: Cell): string | undefined {
        const months = Object.entries(c.month).sort((a, b) => {
            return b[1][0] - a[1][0];
        });
        if (!months.length || months[0][1][0] <= 0) {
            return;
        }
        const key = months[0][0];
        const label = `${MONTHS[+key.slice(5) - 1]} ${key.slice(0, 4)}`;
        return `Peak month: ${label} — ${format(months[0][1][0])} commits.`;
    }

    private featureFix(c: Cell): string | undefined {
        const feat = (c.types['feat'] || [0])[0];
        const fix = (c.types['fix'] || [0])[0];
        if (!feat && !fix) {
            return;
        }
        if (feat >= fix && fix > 0) {
            const ratio = (feat / fix).toFixed(1);
            return `Ships ${format(feat)} features to ${format(fix)} fixes (${ratio}:1) — feature-leaning.`;
        }
        if (fix > feat) {
            return `Leans on maintenance: ${format(fix)} fixes to ${format(feat)} features.`;
        }
        return `${format(feat)} feature commits recorded.`;
    }

    private reviewLine(c: Cell): string | undefined {
        if (c.mergeRequests.reviewed <= 0 && c.mergeRequests.merged <= 0) {
            return;
        }
        const parts: string[] = [];
        if (c.mergeRequests.reviewed > 0) {
            parts.push(`merged ${format(c.mergeRequests.reviewed)} MRs for others`);
        }
        if (c.mergeRequests.rate != null) {
            parts.push(`${c.mergeRequests.rate}% merge rate`);
        }
        if (c.mergeRequests.timeToMerge != null) {
            parts.push(`median ${formatDuration(c.mergeRequests.timeToMerge)} to merge`);
        }
        if (!parts.length) {
            return;
        }
        const head = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
        return `${head}${parts.length > 1 ? ` · ${parts.slice(1).join(' · ')}` : ''}.`;
    }
}
