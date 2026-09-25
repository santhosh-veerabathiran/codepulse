import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NavStore {
    readonly settingsOpen = signal<boolean>(false);
    readonly showSetup = signal<boolean>(false);
    readonly scrollTarget = signal<string>('');

    requestScroll(sectionId: string) {
        this.scrollTarget.set(sectionId);
    }

    openSettings() {
        this.settingsOpen.set(true);
    }

    closeSettings() {
        this.settingsOpen.set(false);
    }

    addWorkspace() {
        this.settingsOpen.set(false);
        this.showSetup.set(true);
    }

    exitSetup() {
        this.showSetup.set(false);
    }
}
