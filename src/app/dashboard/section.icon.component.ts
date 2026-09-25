import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
    selector: 'cp-sec-icon',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            @switch (id()) {
                @case ('sec-team') {
                    <circle cx="9" cy="7" r="3" /><path d="M2 21v-1a6 6 0 0 1 12 0v1" /><path d="M16 3.2a4 4 0 0 1 0 7.6" /><path d="M22 21v-1a6 6 0 0 0-3-5.2" />
                }
                @case ('sec-person') {
                    <circle cx="12" cy="8" r="4" /><path d="M4 21v-1a8 8 0 0 1 16 0v1" />
                }
                @case ('sec-trend') {
                    <polyline points="3 17 9 11 13 15 21 6" /><polyline points="15 6 21 6 21 12" />
                }
                @case ('sec-repos') {
                    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                }
                @case ('sec-momentum') {
                    <line x1="6" y1="20" x2="6" y2="14" /><line x1="12" y1="20" x2="12" y2="9" /><line x1="18" y1="20" x2="18" y2="4" />
                }
                @case ('sec-biggest') {
                    <path d="M12 22a6 6 0 0 0 6-6c0-4-3-6-4-10-2 2-3 3-3 6-1-.5-1.5-1.5-1.5-3C7 11 6 13 6 16a6 6 0 0 0 6 6z" />
                }
                @case ('sec-quality') {
                    <path d="M12 2 2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                }
                @case ('sec-mr') {
                    <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="6" r="3" /><path d="M18 9a9 9 0 0 1-9 9" /><path d="M6 9v6" />
                }
                @case ('sec-work') {
                    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                }
                @case ('sec-ownership') {
                    <circle cx="8" cy="15" r="4" /><path d="M10.8 12.2 20 3" /><path d="M17 6l2 2" /><path d="M14 9l2 2" />
                }
                @case ('sec-activity') {
                    <rect x="3" y="4" width="18" height="17" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="16" y1="2" x2="16" y2="6" />
                }
                @case ('sec-rhythm') {
                    <polyline points="2 12 6 12 9 4 15 20 18 12 22 12" />
                }
                @case ('sec-pulse') {
                    <path d="M20.8 5.6a5 5 0 0 0-8.8-2 5 5 0 0 0-8.8 2c-1 2.4 0 4.9 1.8 6.6L12 20l7-7.8c1.8-1.7 2.8-4.2 1.8-6.6z" />
                }
                @case ('sec-collab') {
                    <path d="M9 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7L11 5" /><path d="M15 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7L13 19" />
                }
                @case ('sec-insights') {
                    <polygon points="12 2 14.6 8.8 21.5 9.2 16.2 13.7 18 20.4 12 16.5 6 20.4 7.8 13.7 2.5 9.2 9.4 8.8" />
                }
                @case ('sec-compare') {
                    <line x1="12" y1="3" x2="12" y2="21" /><path d="M12 6 6 8l3 6a3 3 0 0 1-6 0l3-6z" /><path d="M12 6l6-2 3 6a3 3 0 0 1-6 0l3-6z" />
                }
            }
        </svg>
    `,
    styles: `
        :host {
            display: inline-flex;
            line-height: 0;
        }
    `,
})
export class SectionIconComponent {
    readonly id = input<string>('');
    readonly size = input<number>(18);
}
