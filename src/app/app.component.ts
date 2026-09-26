import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'cp-root',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterOutlet],
    template: `<router-outlet />`,
    styles: `
        :host {
            display: block;
            min-height: 100vh;
            background: transparent;
            color: var(--ink);
        }
    `,
})
export class AppComponent {
    private readonly document = inject(DOCUMENT);

    constructor() {
        // Browser tabs pause CSS animations while hidden; entrance animations can then
        // freeze at frame 0. Finish any that are stuck there once the tab is visible so
        // content (charts especially) never stays stranded in its start state.
        this.document.addEventListener('visibilitychange', () => {
            if (this.document.visibilityState !== 'visible') {
                return;
            }
            for (const animation of this.document.getAnimations()) {
                if (animation.playState === 'running' && animation.currentTime === 0) {
                    try {
                        animation.finish();
                    } catch {
                        /* infinite/non-finishable animations (e.g. the logo pulse) */
                    }
                }
            }
        });
    }
}
