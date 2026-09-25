import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShellComponent } from './dashboard/shell.component';

@Component({
    selector: 'cp-root',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ShellComponent],
    template: `<cp-shell />`,
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
