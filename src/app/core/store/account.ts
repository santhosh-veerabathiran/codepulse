import { Injectable, computed, signal } from '@angular/core';
import { ACCOUNTS_KEY, ACTIVE_KEY } from '../constants';
import { Account } from '../types';

@Injectable({ providedIn: 'root' })
export class AccountStore {
    readonly accounts = signal<Account[]>(this.readAccounts());
    readonly activeId = signal<string | undefined>(this.readActive());
    readonly active = computed<Account | undefined>(() => {
        return this.accounts().find((a) => {
            return a.id === this.activeId();
        });
    });

    add(account: Account) {
        this.accounts.update((list) => {
            return [...list, account];
        });
        this.persist();
    }

    update(id: string, patch: Partial<Account>) {
        this.accounts.update((list) => {
            return list.map((a) => {
                return a.id === id ? { ...a, ...patch } : a;
            });
        });
        this.persist();
    }

    remove(id: string) {
        this.accounts.update((list) => {
            return list.filter((a) => {
                return a.id !== id;
            });
        });
        if (this.activeId() === id) {
            this.setActive(this.accounts()[0]?.id);
        }
        this.persist();
    }

    setActive(id?: string) {
        this.activeId.set(id);
        try {
            if (id) {
                localStorage.setItem(ACTIVE_KEY, id);
            } else {
                localStorage.removeItem(ACTIVE_KEY);
            }
        } catch {
            /* storage unavailable */
        }
    }

    private persist() {
        try {
            localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(this.accounts()));
        } catch {
            /* storage unavailable */
        }
    }

    private readAccounts(): Account[] {
        try {
            const raw = localStorage.getItem(ACCOUNTS_KEY);
            return raw ? (JSON.parse(raw) as Account[]) : [];
        } catch {
            return [];
        }
    }

    private readActive(): string | undefined {
        try {
            return localStorage.getItem(ACTIVE_KEY) ?? undefined;
        } catch {
            return;
        }
    }
}
