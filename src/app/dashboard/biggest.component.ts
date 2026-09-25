import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AnalyticsStore, FactsStore, FiltersStore, format } from '../core';
import { ReplayDirective } from './replay.directive';
import { BiggestRow } from './types';

@Component({
    selector: 'cp-biggest',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ReplayDirective],
    template: `
        <div class="head">
            <p class="eyebrow">Heavy lifts</p>
            <h2>{{ name() }} — biggest single commits</h2>
            <p class="sub">The largest commits by lines changed in this view — the outsized landings.</p>
        </div>
        @if (!rows().length) {
            <p class="empty card">No commits in this view.</p>
        } @else {
            <div class="card block" *cpReplay="viewKey()">
                @for (b of rows(); track b.sha; let i = $index) {
                    <div class="row" [title]="b.title + ' — ' + b.lines + ' lines · ' + b.repo">
                        @if (i < 3) {
                            <span class="medal" [class]="'m' + (i + 1)">{{ i + 1 }}</span>
                        } @else {
                            <span class="rank">{{ i + 1 }}</span>
                        }
                        <div class="body">
                            <p class="title">
                                @if (b.kind) {
                                    <span class="kind">{{ b.kind }}</span>
                                }
                                @if (b.scope) {
                                    <span class="scope mono">{{ b.scope }}</span>
                                }
                                {{ b.title || '(no message)' }}
                            </p>
                            <div class="bar-row">
                                <div class="track"><i [style.width.%]="b.percent"></i></div>
                                <span class="tags">
                                    <span class="repo mono">{{ b.repo }}</span>
                                    <span class="mono">{{ b.date }}</span>
                                    @if (b.sha) {
                                        @if (b.url) {
                                            <a class="sha mono" [href]="b.url" target="_blank" rel="noopener noreferrer" (click)="$event.stopPropagation()">{{ b.sha }}</a>
                                        } @else {
                                            <span class="sha mono">{{ b.sha }}</span>
                                        }
                                    }
                                </span>
                            </div>
                        </div>
                        <span class="lines">{{ b.lines }}<em>lines</em></span>
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
        h2 {
            font: 800 22px var(--font-d);
            margin: 0;
            color: var(--ink);
        }
        .sub {
            font-size: 12.5px;
            color: var(--muted);
            margin: 4px 0 0;
            max-width: 74ch;
        }
        .card {
            background: var(--glass, var(--surface));
            border: 1px solid var(--glass-brd, var(--line));
            border-radius: var(--radius, 14px);
        }
        .block {
            padding: 8px 14px;
        }
        .row {
            display: grid;
            grid-template-columns: 26px 1fr 92px;
            align-items: center;
            gap: 14px;
            padding: 12px 6px;
        }
        .row + .row {
            border-top: 1px solid var(--line-2, var(--line));
        }
        .rank {
            font: 800 12.5px var(--mono);
            color: var(--muted);
            text-align: center;
        }
        .medal {
            display: inline-grid;
            place-items: center;
            width: 22px;
            height: 22px;
            border-radius: 7px;
            font: 800 11px var(--font);
            color: #fff;
            justify-self: center;
        }
        .m1 {
            background: linear-gradient(145deg, #f5b942, #e59505);
        }
        .m2 {
            background: linear-gradient(145deg, #aab6c6, #8896aa);
        }
        .m3 {
            background: linear-gradient(145deg, #e08a54, #c06a32);
        }
        .body {
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 7px;
        }
        .title {
            margin: 0;
            font: 600 13px var(--font);
            color: var(--ink);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .kind {
            font: 700 9.5px var(--font);
            letter-spacing: 0.04em;
            color: var(--acc-ink, var(--acc));
            background: var(--acc-soft);
            border-radius: 5px;
            padding: 2px 6px;
            margin-right: 6px;
        }
        .scope {
            color: var(--muted);
            margin-right: 6px;
        }
        .bar-row {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .track {
            flex: 1;
            min-width: 60px;
            height: 6px;
            border-radius: 6px;
            background: var(--track, var(--surface-2));
            overflow: hidden;
        }
        .track i {
            display: block;
            height: 100%;
            min-width: 3px;
            border-radius: 6px;
            background: var(--grad, var(--acc));
            box-shadow: 0 0 10px var(--acc-soft);
            transition: width 0.45s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .tags {
            display: flex;
            gap: 9px;
            flex-wrap: wrap;
            font-size: 10.5px;
            flex: none;
        }
        .repo {
            color: var(--ink-2, var(--muted));
        }
        .tags .mono {
            color: var(--muted);
        }
        a.sha {
            color: var(--acc-ink, var(--acc));
            text-decoration: none;
            border-bottom: 1px solid transparent;
            transition: border-color 0.13s;
        }
        a.sha:hover {
            border-bottom-color: currentColor;
        }
        .lines {
            text-align: right;
            font: 800 15px var(--mono);
            color: var(--ink);
            font-variant-numeric: tabular-nums;
        }
        .lines em {
            display: block;
            font: 600 10px var(--font);
            font-style: normal;
            color: var(--muted);
        }
        .empty {
            padding: 24px;
            text-align: center;
            color: var(--muted);
        }
        @media (max-width: 640px) {
            .tags {
                display: none;
            }
        }
    `,
})
export class BiggestComponent {
    private readonly analytics = inject(AnalyticsStore);
    private readonly facts = inject(FactsStore);
    private readonly filters = inject(FiltersStore);

    protected readonly viewKey = this.filters.viewKey;
    protected readonly name = computed<string>(() => {
        return this.analytics.personName(this.filters.personId());
    });

    protected readonly rows = computed<BiggestRow[]>(() => {
        const commits = this.analytics.selectedCell()?.largest ?? [];
        const template = this.facts.facts()?.commitUrl ?? '';
        const max = Math.max(
            1,
            ...commits.map((c) => {
                return c.lines;
            }),
        );
        return commits.map((c) => {
            return {
                date: c.date,
                kind: c.kind,
                scope: c.scope,
                title: c.title,
                sha: c.sha ? c.sha.slice(0, 8) : '',
                repo: c.repo,
                lines: format(c.lines),
                percent: (c.lines / max) * 100,
                url: this.commitLink(template, c.repo, c.sha),
            };
        });
    });

    private commitLink(template: string, repo: string, sha: string): string {
        if (!template || !sha) {
            return '';
        }
        return template.replaceAll('{repo}', encodeURIComponent(repo)).replaceAll('{sha}', encodeURIComponent(sha));
    }
}
