import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { Account, AccountStore, FactsStore, FilePickerWindow, NavStore, SourceFileHandle, SourceKind } from '../core';
@Component({
    selector: 'cp-onboarding',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="setup">
            @if (canExit()) {
                <button type="button" class="back" (click)="exit()">← Back to dashboard</button>
            }
            <div class="hero">
                <h1>CodePulse</h1>
                <p>Contribution analytics that runs entirely in your browser. Your data never leaves this device — it's stored locally, not on any server.</p>
            </div>

            @if (accounts().length) {
                <div class="card accts">
                    <p class="ttl">Your workspaces</p>
                    @for (a of accounts(); track a.id) {
                        <div class="acct" [class.editing]="editingId() === a.id">
                            <span class="badge" [class]="a.kind">{{ a.kind }}</span>
                            <span class="an">
                                {{ a.label }}
                                @if (a.sourceName) {
                                    <em class="src">{{ a.sourceName }}</em>
                                }
                            </span>
                            <span class="ad">{{ a.dataAt ? 'data ready' : 'no data — import below' }}</span>
                            <div class="acts">
                                <button type="button" class="mini" (click)="edit(a)">Edit</button>
                                @if (a.kind === Json && a.dataAt) {
                                    <button type="button" class="mini" [disabled]="busy()" (click)="refresh(a)" title="Re-read the snapshot file">Refresh</button>
                                }
                                @if (a.dataAt) {
                                    <button type="button" class="use" (click)="use(a.id)">Open</button>
                                } @else {
                                    <button type="button" class="use ghost" (click)="choose(a)">Import into this</button>
                                }
                            </div>
                        </div>
                    }
                </div>
            }

            <div class="paths">
                <div class="card path">
                    <p class="ttl">Import a snapshot</p>
                    <p class="pd">
                        Load a <code>facts.json</code> produced by the pipeline. Stored locally for next time.
                        @if (canRemember) {
                            The file is remembered, so you can <b>Refresh</b> from the same file whenever it's regenerated.
                        }
                    </p>
                    <button type="button" class="filebtn" [disabled]="busy()" (click)="choose(targetAccount())">Choose facts.json</button>
                    <input #fileInput type="file" accept="application/json,.json" hidden (change)="onFile($event)" />
                    @if (target()) {
                        <p class="into">
                            Importing into: <b>{{ targetLabel() }}</b>
                        </p>
                    }
                </div>

                <div class="card path">
                    <p class="ttl">{{ editingId() ? 'Edit workspace' : 'Connect a provider' }}</p>
                    @if (!isJsonEdit()) {
                        <div class="prov">
                            <button type="button" [class.on]="kind() === GitHub" [disabled]="!!editingId()" (click)="kind.set(GitHub)">GitHub</button>
                            <button type="button" [class.on]="kind() === GitLab" [disabled]="!!editingId()" (click)="kind.set(GitLab)">GitLab</button>
                        </div>
                    }
                    <input class="in" placeholder="Workspace name" [value]="label()" (input)="label.set($any($event.target).value)" />
                    @if (isJsonEdit()) {
                        <p class="note">Snapshot workspace — rename it above, or replace its data from a file.</p>
                        <button type="button" class="save ghostbtn" [disabled]="busy()" (click)="choose(editing())">Choose new snapshot</button>
                    } @else {
                        <input class="in" placeholder="Host (optional, e.g. gitlab.company.com)" [value]="host()" (input)="host.set($any($event.target).value)" />
                        <input class="in" placeholder="Username" [value]="username()" (input)="username.set($any($event.target).value)" />
                        <input class="in" type="password" [placeholder]="editingId() ? 'Personal access token (leave to keep current)' : 'Personal access token'" [value]="token()" (input)="token.set($any($event.target).value)" />
                        <textarea class="in ta" placeholder="Repositories, one per line (GitLab: group/project — GitHub: owner/repo)" [value]="repos()" (input)="repos.set($any($event.target).value)"></textarea>
                        <p class="warn">⚠ The token is saved in this browser's local storage so the account survives across sessions. Anyone with access to this browser profile can read it. Use a read-only, minimally-scoped token.</p>
                    }
                    <div class="formacts">
                        <button type="button" class="save" [disabled]="!canSave()" (click)="save()">{{ editingId() ? 'Update workspace' : 'Save account' }}</button>
                        @if (editingId()) {
                            <button type="button" class="ghostbtn" (click)="cancelEdit()">Cancel</button>
                        }
                    </div>
                    @if (!isJsonEdit()) {
                        @if (savedProvider(); as sp) {
                            <div class="fetchbox">
                                <button type="button" class="save" [disabled]="fetching()" (click)="fetchNow(sp)">{{ fetching() ? 'Fetching…' : 'Fetch from provider now' }}</button>
                                @if (fetchMsg()) {
                                    <span class="fmsg">{{ fetchMsg() }}</span>
                                }
                            </div>
                            <p class="note">First-cut provider fetch: pulls commits &amp; merge/pull requests via the API. Line categorization is rough versus the full pipeline, and large orgs can hit API rate limits. Or import a snapshot above.</p>
                        } @else if (!editingId()) {
                            <p class="note">Connecting saves the account &amp; credentials. Then fetch from the provider, or import a snapshot into it above.</p>
                        }
                    }
                </div>
            </div>

            @if (error()) {
                <p class="err">{{ error() }}</p>
            }
        </div>
    `,
    styles: `
        :host {
            display: block;
        }
        .setup {
            max-width: 940px;
            margin: 0 auto;
            padding: 40px 24px 80px;
            display: flex;
            flex-direction: column;
            gap: 18px;
        }
        .back {
            align-self: flex-start;
            background: none;
            border: 1px solid var(--line);
            color: var(--ink);
            border-radius: 8px;
            padding: 7px 13px;
            font: 600 12px var(--font);
            cursor: pointer;
        }
        .hero {
            text-align: center;
            margin-bottom: 6px;
        }
        .hero h1 {
            font: 800 30px var(--font-d);
            margin: 0;
            color: var(--ink);
            letter-spacing: -0.02em;
        }
        .hero p {
            color: var(--muted);
            font-size: 13.5px;
            max-width: 60ch;
            margin: 10px auto 0;
            line-height: 1.5;
        }
        .card {
            background: var(--glass, var(--surface));
            border: 1px solid var(--glass-brd, var(--line));
            border-radius: var(--radius, 14px);
            padding: 18px 20px;
        }
        .ttl {
            font: 700 12px var(--font);
            letter-spacing: 0.04em;
            color: var(--ink);
            margin: 0 0 12px;
        }
        .acct {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px 0;
            border-top: 1px solid var(--line);
        }
        .acct:first-of-type {
            border-top: 0;
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
        .an {
            font: 600 13.5px var(--font);
            color: var(--ink);
            flex: 1;
            min-width: 0;
        }
        .src {
            display: block;
            font: 500 10.5px var(--mono);
            font-style: normal;
            color: var(--muted);
            margin-top: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .acts {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .mini {
            background: none;
            border: 1px solid var(--line);
            color: var(--ink);
            border-radius: 8px;
            padding: 7px 12px;
            font: 600 12px var(--font);
            cursor: pointer;
        }
        .mini:hover:not(:disabled) {
            border-color: var(--acc);
            color: var(--acc-ink, var(--acc));
        }
        .mini:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .acct.editing {
            box-shadow: inset 2px 0 0 var(--acc);
        }
        .ad {
            font-size: 11.5px;
            color: var(--muted);
        }
        .use {
            background: var(--acc);
            color: #04121c;
            border: 0;
            border-radius: 8px;
            padding: 7px 14px;
            font: 700 12px var(--font);
            cursor: pointer;
        }
        .use.ghost {
            background: none;
            border: 1px solid var(--line);
            color: var(--ink);
        }
        .paths {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 18px;
        }
        .pd {
            font-size: 12.5px;
            color: var(--muted);
            margin: 0 0 14px;
            line-height: 1.5;
        }
        .filebtn {
            display: inline-block;
            background: var(--acc);
            color: #04121c;
            border-radius: 9px;
            padding: 10px 16px;
            font: 700 12.5px var(--font);
            cursor: pointer;
        }
        .filebtn input {
            display: none;
        }
        .into {
            font-size: 12px;
            color: var(--muted);
            margin: 12px 0 0;
        }
        .prov {
            display: flex;
            gap: 6px;
            margin-bottom: 12px;
        }
        .prov button {
            flex: 1;
            border: 1px solid var(--line);
            background: var(--surface-2);
            color: var(--muted);
            border-radius: 8px;
            padding: 8px;
            font: 700 12px var(--font);
            cursor: pointer;
        }
        .prov button.on {
            border-color: var(--acc);
            color: var(--ink);
        }
        .in {
            width: 100%;
            box-sizing: border-box;
            background: var(--surface-2);
            color: var(--ink);
            border: 1px solid var(--line);
            border-radius: 9px;
            padding: 9px 11px;
            font: 500 12.5px var(--font);
            margin-bottom: 8px;
            outline: none;
        }
        .in:focus {
            border-color: var(--acc);
        }
        .ta {
            min-height: 66px;
            resize: vertical;
            font-family: var(--mono);
            font-size: 11.5px;
        }
        .fetchbox {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-top: 10px;
            flex-wrap: wrap;
        }
        .fmsg {
            font-size: 11.5px;
            color: var(--acc);
        }
        .warn {
            font-size: 11px;
            color: var(--warn, #f59e0b);
            line-height: 1.45;
            margin: 4px 0 12px;
        }
        .save {
            background: var(--acc);
            color: #04121c;
            border: 0;
            border-radius: 9px;
            padding: 10px 16px;
            font: 700 12.5px var(--font);
            cursor: pointer;
        }
        .save:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .filebtn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .formacts {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
        }
        .ghostbtn {
            background: none;
            border: 1px solid var(--line);
            color: var(--ink);
        }
        .note {
            font-size: 11px;
            color: var(--muted);
            margin: 12px 0 0;
            line-height: 1.45;
        }
        .err {
            color: var(--bad, #ef4444);
            font-size: 12.5px;
            text-align: center;
        }
        @media (max-width: 760px) {
            .paths {
                grid-template-columns: 1fr;
            }
        }
    `,
})
export class OnboardingComponent {
    private readonly factsStore = inject(FactsStore);
    private readonly accountStore = inject(AccountStore);
    private readonly nav = inject(NavStore);

    protected readonly accounts = this.accountStore.accounts;
    protected readonly error = this.factsStore.error;
    protected readonly canExit = computed<boolean>(() => {
        return this.nav.showSetup() && this.factsStore.ready();
    });

    protected readonly GitHub = SourceKind.GitHub;
    protected readonly GitLab = SourceKind.GitLab;
    protected readonly kind = signal<SourceKind>(SourceKind.GitHub);
    protected readonly label = signal<string>('');
    protected readonly host = signal<string>('');
    protected readonly username = signal<string>('');
    protected readonly token = signal<string>('');
    protected readonly repos = signal<string>('');
    protected readonly Json = SourceKind.Json;
    protected readonly target = signal<string | undefined>(undefined);
    protected readonly editingId = signal<string | undefined>(undefined);
    protected readonly busy = signal<boolean>(false);
    protected readonly fetching = this.factsStore.fetching;
    protected readonly fetchMsg = this.factsStore.fetchMsg;
    protected readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
    private readonly picker = window as unknown as FilePickerWindow;
    protected readonly canRemember = typeof this.picker.showOpenFilePicker === 'function';

    protected readonly editing = computed<Account | undefined>(() => {
        const id = this.editingId();
        return this.accounts().find((a) => {
            return a.id === id;
        });
    });
    protected readonly isJsonEdit = computed<boolean>(() => {
        return this.editing()?.kind === SourceKind.Json;
    });
    protected readonly canSave = computed<boolean>(() => {
        if (!this.label().trim()) {
            return false;
        }
        if (this.isJsonEdit() || this.editingId()) {
            return true;
        }
        return this.token().length > 0;
    });
    protected readonly targetAccount = computed<Account | undefined>(() => {
        const id = this.target();
        return this.accounts().find((a) => {
            return a.id === id;
        });
    });

    constructor() {
        const id = this.nav.editId();
        const account = id
            ? this.accounts().find((a) => {
                  return a.id === id;
              })
            : undefined;
        if (account) {
            this.edit(account);
        }
    }

    protected readonly targetLabel = computed<string>(() => {
        const id = this.target();
        return (
            this.accounts().find((a) => {
                return a.id === id;
            })?.label ?? ''
        );
    });

    protected readonly savedProvider = computed<Account | undefined>(() => {
        const account = this.accounts().find((a) => {
            return a.id === this.target();
        });
        if (account && account.kind !== SourceKind.Json && account.token) {
            return account;
        }
        return;
    });

    protected exit() {
        this.nav.exitSetup();
    }

    protected use(id: string) {
        void this.factsStore.switchAccount(id);
        this.nav.exitSetup();
    }

    protected save() {
        const id = this.editingId();
        if (!id) {
            this.connect();
            return;
        }
        const providerEdit = !this.isJsonEdit();
        const patch: Partial<Account> = providerEdit
            ? {
                  label: this.label().trim(),
                  host: this.host().trim() || undefined,
                  username: this.username().trim() || undefined,
                  token: this.token() || undefined,
                  repos: this.parseRepos(),
              }
            : { label: this.label().trim() };
        this.accountStore.update(id, patch);
        this.cancelEdit();
        if (providerEdit) {
            this.target.set(id);
        }
    }

    protected edit(account: Account) {
        this.editingId.set(account.id);
        this.target.set(undefined);
        if (account.kind !== SourceKind.Json) {
            this.kind.set(account.kind);
        }
        this.label.set(account.label);
        this.host.set(account.host ?? '');
        this.username.set(account.username ?? '');
        this.token.set(account.token ?? '');
        this.repos.set((account.repos ?? []).join('\n'));
    }

    protected cancelEdit() {
        this.editingId.set(undefined);
        this.resetForm();
    }

    private connect() {
        const account: Account = {
            id: crypto.randomUUID(),
            kind: this.kind(),
            label: this.label().trim(),
            host: this.host().trim() || undefined,
            username: this.username().trim() || undefined,
            token: this.token() || undefined,
            repos: this.parseRepos(),
            createdAt: Date.now(),
        };
        this.accountStore.add(account);
        this.accountStore.setActive(account.id);
        this.target.set(account.id);
        this.resetForm();
    }

    private resetForm() {
        this.label.set('');
        this.host.set('');
        this.username.set('');
        this.token.set('');
        this.repos.set('');
    }

    protected fetchNow(account: Account) {
        void this.factsStore.refreshFromProvider(account);
    }

    protected async choose(target?: Account) {
        if (target) {
            this.target.set(target.id);
        }
        if (!this.picker.showOpenFilePicker) {
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
            const account = this.resolveTarget(handle.name);
            await this.factsStore.importFromHandle(account, handle);
        } finally {
            this.busy.set(false);
        }
        if (!this.error()) {
            this.afterImport();
        }
    }

    protected async refresh(account: Account) {
        this.busy.set(true);
        let refreshed = false;
        try {
            refreshed = await this.factsStore.refreshJson(account);
        } finally {
            this.busy.set(false);
        }
        if (refreshed) {
            this.afterImport();
            return;
        }
        await this.choose(account);
    }

    private afterImport() {
        this.target.set(undefined);
        this.editingId.set(undefined);
        this.nav.exitSetup();
    }

    private parseRepos(): string[] {
        return this.repos()
            .split(/[\n,]/)
            .map((r) => {
                return r.trim();
            })
            .filter((r) => {
                return r.length > 0;
            });
    }

    protected onFile(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) {
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed = JSON.parse(String(reader.result));
                const account = this.resolveTarget(file.name);
                void this.factsStore.importFacts(account, parsed);
                this.afterImport();
            } catch {
                this.factsStore.error.set('Could not parse that file as JSON.');
            }
        };
        reader.readAsText(file);
        input.value = '';
    }

    private resolveTarget(fileName: string): Account {
        const id = this.target();
        const existing = this.accounts().find((a) => {
            return a.id === id;
        });
        if (existing) {
            return existing;
        }
        const account: Account = {
            id: crypto.randomUUID(),
            kind: SourceKind.Json,
            label: fileName.replace(/\.json$/i, '') || 'Snapshot',
            createdAt: Date.now(),
        };
        this.accountStore.add(account);
        return account;
    }
}
