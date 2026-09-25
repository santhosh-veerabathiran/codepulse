import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { Account, AccountStore, FactsStore, FilePickerWindow, NavStore, SourceFileHandle, SourceKind, format } from '../core';
@Component({
    selector: 'cp-settings',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="scrim" (click)="close()"></div>
        <aside class="panel" role="dialog" aria-label="Settings">
            <header>
                <h2>Settings</h2>
                <button type="button" class="x" (click)="close()" aria-label="Close">✕</button>
            </header>

            <section>
                <p class="lbl">Current workspace</p>
                @if (active(); as a) {
                    <div class="cur">
                        <span class="badge" [class]="a.kind">{{ a.kind }}</span>
                        <div class="cur-b">
                            <b>{{ a.label }}</b>
                            <span>{{ counts() }}</span>
                        </div>
                    </div>
                    <div class="btnrow">
                        @if (a.kind === Json) {
                            <button type="button" [disabled]="busy()" (click)="refreshFile(a)" title="Re-read the remembered snapshot file">↻ Refresh from file</button>
                            <button type="button" [disabled]="busy()" (click)="pickInto(a)">Choose file…</button>
                        } @else {
                            <button type="button" [disabled]="fetching()" (click)="refresh(a)">↻ Refresh from remote</button>
                        }
                        <button type="button" (click)="editDetails(a)">Edit details</button>
                    </div>
                    @if (a.sourceName) {
                        <p class="msg src">from {{ a.sourceName }}</p>
                    }
                    @if (fetching()) {
                        <p class="msg">{{ fetchMsg() || 'Fetching from provider…' }}</p>
                    }
                    @if (msg()) {
                        <p class="msg">{{ msg() }}</p>
                    }
                    <input #fileInput type="file" accept="application/json,.json" hidden (change)="onFile($event)" />
                } @else {
                    <p class="empty">No workspace selected.</p>
                }
            </section>

            @if (accounts().length > 1) {
                <section>
                    <p class="lbl">Switch workspace</p>
                    @for (a of accounts(); track a.id) {
                        <div class="sw">
                            <span class="dot" [class.on]="a.id === activeId()"></span>
                            <span class="badge" [class]="a.kind">{{ a.kind }}</span>
                            <span class="sn">{{ a.label }}</span>
                            <span class="sd">{{ a.dataAt ? 'data ready' : 'no data' }}</span>
                            <button type="button" class="mini" (click)="switch(a.id)" [disabled]="a.id === activeId()">Open</button>
                            <button type="button" class="mini" (click)="editDetails(a)">Edit</button>
                            <button type="button" class="mini danger" (click)="askRemove.set(a.id)">Remove</button>
                        </div>
                        @if (askRemove() === a.id) {
                            <div class="confirm">
                                Remove <b>{{ a.label }}</b> and its stored data &amp; credentials?
                                <button type="button" class="mini danger" (click)="remove(a.id)">Remove</button>
                                <button type="button" class="mini" (click)="askRemove.set(undefined)">Cancel</button>
                            </div>
                        }
                    }
                </section>
            }

            <section>
                <p class="lbl">Add</p>
                <button type="button" class="wide" (click)="addWorkspace()">+ Add a workspace / provider</button>
            </section>

            <section class="danger-zone">
                <p class="lbl">Danger zone</p>
                <p class="dz-note">Clears the loaded dataset for the current workspace. Saved accounts &amp; credentials are kept, so you can re-import or reconnect without re-entering them.</p>
                @if (!confirmClear()) {
                    <button type="button" class="wide danger" (click)="confirmClear.set(true)" [disabled]="!active()?.dataAt">Clear data</button>
                } @else {
                    <div class="confirm">
                        Clear the data for this workspace?
                        <button type="button" class="mini danger" (click)="clear()">Yes, clear</button>
                        <button type="button" class="mini" (click)="confirmClear.set(false)">Cancel</button>
                    </div>
                }
            </section>
        </aside>
    `,
    styles: `
        :host {
            position: fixed;
            inset: 0;
            z-index: 60;
        }
        .scrim {
            position: absolute;
            inset: 0;
            background: rgba(2, 8, 16, 0.55);
            backdrop-filter: blur(2px);
        }
        .panel {
            position: absolute;
            top: 0;
            right: 0;
            height: 100%;
            width: min(420px, 92vw);
            background: var(--surface, #0e141b);
            border-left: 1px solid var(--line);
            box-sizing: border-box;
            padding: 20px 22px 40px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 22px;
        }
        header {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        header h2 {
            font: 800 18px var(--font-d);
            margin: 0;
            color: var(--ink);
        }
        .x {
            background: none;
            border: 0;
            color: var(--muted);
            font-size: 16px;
            cursor: pointer;
        }
        .lbl {
            font: 700 10px var(--font);
            letter-spacing: 0.06em;
            color: var(--muted);
            margin: 0 0 10px;
        }
        .cur {
            display: flex;
            align-items: center;
            gap: 11px;
            margin-bottom: 12px;
        }
        .cur-b {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        .cur-b b {
            font: 700 14px var(--font);
            color: var(--ink);
        }
        .cur-b span {
            font-size: 11.5px;
            color: var(--muted);
        }
        .badge {
            font: 700 9px var(--font);
            letter-spacing: 0.04em;
            padding: 3px 8px;
            border-radius: 20px;
            background: var(--surface-2);
            color: var(--muted);
        }
        .badge.github {
            color: var(--s2);
        }
        .badge.gitlab {
            color: var(--s8, var(--warn));
        }
        .btnrow {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }
        .btnrow button,
        .fbtn {
            border: 1px solid var(--line);
            background: var(--surface-2);
            color: var(--ink);
            border-radius: 8px;
            padding: 8px 12px;
            font: 600 12px var(--font);
            cursor: pointer;
        }
        .fbtn input {
            display: none;
        }
        .msg {
            font-size: 12px;
            color: var(--acc);
            margin: 10px 0 0;
        }
        .sw {
            display: flex;
            align-items: center;
            gap: 9px;
            padding: 7px 0;
        }
        .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--line);
            flex: none;
        }
        .dot.on {
            background: var(--good, #34d399);
        }
        .sn {
            font: 600 13px var(--font);
            color: var(--ink);
            flex: 1;
        }
        .sd {
            font-size: 11px;
            color: var(--muted);
        }
        .mini {
            border: 1px solid var(--line);
            background: none;
            color: var(--ink);
            border-radius: 7px;
            padding: 5px 10px;
            font: 600 11.5px var(--font);
            cursor: pointer;
        }
        .mini:disabled {
            opacity: 0.4;
            cursor: default;
        }
        .mini.danger {
            color: var(--bad, #ef4444);
            border-color: color-mix(in srgb, var(--bad, #ef4444) 40%, var(--line));
        }
        .confirm {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
            font-size: 12px;
            color: var(--muted);
            padding: 8px 10px;
            background: var(--surface-2);
            border-radius: 8px;
            margin: 4px 0 8px;
        }
        .wide {
            width: 100%;
            border: 1px solid var(--line);
            background: var(--surface-2);
            color: var(--ink);
            border-radius: 9px;
            padding: 10px;
            font: 600 12.5px var(--font);
            cursor: pointer;
        }
        .wide.danger {
            color: var(--bad, #ef4444);
            border-color: color-mix(in srgb, var(--bad, #ef4444) 40%, var(--line));
        }
        .wide:disabled {
            opacity: 0.4;
            cursor: default;
        }
        .danger-zone {
            margin-top: auto;
            border-top: 1px solid var(--line);
            padding-top: 18px;
        }
        .dz-note {
            font-size: 11.5px;
            color: var(--muted);
            line-height: 1.45;
            margin: 0 0 12px;
        }
        .empty {
            color: var(--muted);
            font-size: 12.5px;
        }
    `,
})
export class SettingsComponent {
    private readonly factsStore = inject(FactsStore);
    private readonly accountStore = inject(AccountStore);
    private readonly nav = inject(NavStore);

    protected readonly accounts = this.accountStore.accounts;
    protected readonly activeId = this.accountStore.activeId;
    protected readonly active = this.accountStore.active;

    protected readonly Json = SourceKind.Json;
    protected readonly confirmClear = signal<boolean>(false);
    protected readonly askRemove = signal<string | undefined>(undefined);
    protected readonly msg = signal<string>('');
    protected readonly busy = signal<boolean>(false);
    protected readonly fetching = this.factsStore.fetching;
    protected readonly fetchMsg = this.factsStore.fetchMsg;
    protected readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
    private readonly picker = window as unknown as FilePickerWindow;
    private pendingFile?: Account;

    protected readonly counts = computed<string>(() => {
        const g = this.factsStore.facts()?.grand;
        const a = this.active();
        if (!g) {
            return 'no data loaded';
        }
        const when = a?.dataAt ? new Date(a.dataAt).toLocaleDateString() : '';
        return `${format(g.commits)} commits · ${g.contributors} contributors · ${when}`;
    });

    protected close() {
        this.nav.closeSettings();
    }

    protected switch(id: string) {
        void this.factsStore.switchAccount(id);
        this.nav.closeSettings();
    }

    protected refresh(account: Account) {
        if (!account.repos?.length) {
            this.msg.set('No repositories are configured for this account — remove it and reconnect with repo paths.');
            return;
        }
        this.msg.set('');
        void this.factsStore.refreshFromProvider(account);
    }

    protected async refreshFile(account: Account) {
        this.msg.set('');
        this.busy.set(true);
        let refreshed = false;
        try {
            refreshed = await this.factsStore.refreshJson(account);
        } finally {
            this.busy.set(false);
        }
        if (refreshed) {
            this.msg.set('Refreshed from the saved file.');
            return;
        }
        await this.pickInto(account);
    }

    protected async pickInto(account: Account) {
        this.msg.set('');
        if (!this.picker.showOpenFilePicker) {
            this.pendingFile = account;
            this.fileInput()?.nativeElement.click();
            return;
        }
        let handle: SourceFileHandle | undefined;
        try {
            const handles = await this.picker.showOpenFilePicker({ types: [{ description: 'CodePulse snapshot', accept: { 'application/json': ['.json'] } }] });
            handle = handles[0];
        } catch {
            return;
        }
        if (!handle) {
            return;
        }
        this.busy.set(true);
        try {
            await this.factsStore.importFromHandle(account, handle);
        } finally {
            this.busy.set(false);
        }
        if (!this.factsStore.error()) {
            this.msg.set('Snapshot imported.');
        }
    }

    protected editDetails(account: Account) {
        this.nav.editAccount(account.id);
    }

    protected addWorkspace() {
        this.nav.addWorkspace();
    }

    protected clear() {
        void this.factsStore.clearActiveData();
        this.confirmClear.set(false);
        this.nav.closeSettings();
    }

    protected remove(id: string) {
        void this.factsStore.removeAccount(id);
        this.askRemove.set(undefined);
    }

    protected onFile(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        const account = this.pendingFile;
        this.pendingFile = undefined;
        if (!file || !account) {
            input.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed = JSON.parse(String(reader.result));
                void this.factsStore.importFacts(account, parsed);
                this.msg.set('Snapshot imported.');
            } catch {
                this.factsStore.error.set('Could not parse that file as JSON.');
            }
        };
        reader.readAsText(file);
        input.value = '';
    }
}
