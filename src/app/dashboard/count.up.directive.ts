import { Directive, effect, ElementRef, inject, input } from '@angular/core';

@Directive({
    selector: '[cpCountUp]',
    standalone: true,
})
export class CountUpDirective {
    private readonly host = inject(ElementRef<HTMLElement>);
    readonly value = input.required<number>({ alias: 'cpCountUp' });
    readonly formatValue = input<(n: number) => string>((n) => {
        return String(Math.round(n));
    });
    private current = 0;
    private frame = 0;

    constructor() {
        effect(() => {
            this.animate(this.value());
        });
    }

    private animate(target: number) {
        cancelAnimationFrame(this.frame);
        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
        const from = this.current;
        if (reduce || from === target || !Number.isFinite(target)) {
            this.current = target;
            this.paint(target);
            return;
        }
        const start = performance.now();
        const duration = 620;
        const step = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            this.current = from + (target - from) * eased;
            this.paint(this.current);
            if (t < 1) {
                this.frame = requestAnimationFrame(step);
            }
        };
        this.frame = requestAnimationFrame(step);
    }

    private paint(value: number) {
        this.host.nativeElement.textContent = this.formatValue()(value);
    }
}
