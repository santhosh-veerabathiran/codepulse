import { Routes } from '@angular/router';
import { TemplateShellComponent } from './dashboard/template.shell.component';

const KNOWN = ['classic', 'terminal', 'studio', 'editorial', 'console'];

function storedTemplate(): string {
    try {
        const slug = localStorage.getItem('codepulse.template') ?? 'classic';
        return KNOWN.includes(slug) ? slug : 'classic';
    } catch {
        return 'classic';
    }
}

export const appRoutes: Routes = [
    { path: '', pathMatch: 'full', redirectTo: () => storedTemplate() },
    { path: ':template', component: TemplateShellComponent },
];
