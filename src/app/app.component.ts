import { ChangeDetectionStrategy, Component } from '@angular/core';
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
export class AppComponent {}
