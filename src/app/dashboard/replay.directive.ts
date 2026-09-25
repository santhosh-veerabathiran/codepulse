import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';

// Structural directive: `*cpReplay="key"` re-creates its content whenever `key`
// changes, so CSS entrance animations inside replay on any view change — not just
// on first load. One line per panel instead of hand-wrapping each template.
@Directive({
    selector: '[cpReplay]',
    standalone: true,
})
export class ReplayDirective {
    private readonly template = inject(TemplateRef);
    private readonly viewContainer = inject(ViewContainerRef);
    private rendered = false;
    private previous: unknown;

    @Input()
    set cpReplay(key: unknown) {
        if (this.rendered && key === this.previous) {
            return;
        }
        this.previous = key;
        this.rendered = true;
        this.viewContainer.clear();
        this.viewContainer.createEmbeddedView(this.template);
    }
}
