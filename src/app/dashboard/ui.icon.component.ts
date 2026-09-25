import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
    selector: 'cp-icon',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" [attr.stroke-width]="stroke()" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            @switch (name()) {
                @case ('folder') {
                    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                }
                @case ('calendar') {
                    <rect x="3" y="4" width="18" height="17" rx="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                }
                @case ('award') {
                    <circle cx="12" cy="8" r="6" />
                    <path d="M8.5 13.5 7 22l5-3 5 3-1.5-8.5" />
                }
                @case ('code') {
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                }
                @case ('layers') {
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 17 12 22 22 17" />
                    <polyline points="2 12 12 17 22 12" />
                }
                @case ('user') {
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21v-1a8 8 0 0 1 16 0v1" />
                }
                @case ('users') {
                    <circle cx="9" cy="7" r="3" />
                    <path d="M2 21v-1a6 6 0 0 1 12 0v1" />
                    <path d="M16 3.2a4 4 0 0 1 0 7.6" />
                    <path d="M22 21v-1a6 6 0 0 0-3-5.2" />
                }
                @case ('search') {
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                }
                @case ('filter') {
                    <polygon points="22 3 2 3 10 12.5 10 19 14 21 14 12.5 22 3" />
                }
                @case ('palette') {
                    <circle cx="13.5" cy="6.5" r="1.5" />
                    <circle cx="17.5" cy="10.5" r="1.5" />
                    <circle cx="8.5" cy="7.5" r="1.5" />
                    <circle cx="6.5" cy="12.5" r="1.5" />
                    <path d="M12 2a10 10 0 0 0 0 20 2.5 2.5 0 0 0 2.5-2.5c0-.7-.3-1.3-.7-1.7-.4-.4-.6-.9-.6-1.5A2.3 2.3 0 0 1 15.5 14H18a4 4 0 0 0 4-4 8 8 0 0 0-8-8z" />
                }
                @case ('layout') {
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18" />
                    <path d="M9 21V9" />
                }
                @case ('gear') {
                    <circle cx="12" cy="12" r="3" />
                    <path
                        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
                    />
                }
                @case ('chevron') {
                    <polyline points="6 9 12 15 18 9" />
                }
                @case ('check') {
                    <polyline points="20 6 9 17 4 12" />
                }
                @case ('sidebar') {
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="9" y1="3" x2="9" y2="21" />
                }
                @case ('grid') {
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                }
                @case ('type') {
                    <polyline points="4 7 4 4 20 4 20 7" />
                    <line x1="9" y1="20" x2="15" y2="20" />
                    <line x1="12" y1="4" x2="12" y2="20" />
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
export class UiIconComponent {
    readonly name = input<string>('');
    readonly size = input<number>(16);
    readonly stroke = input<number>(1.8);
}
