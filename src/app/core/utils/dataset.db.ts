import { Injectable } from '@angular/core';
import { Facts, SourceFileHandle } from '../types';

const DB_NAME = 'codepulse';
const STORE = 'datasets';
const HANDLE_STORE = 'handles';
const VERSION = 2;

@Injectable({ providedIn: 'root' })
export class DatasetDb {
    private dbPromise?: Promise<IDBDatabase>;

    async put(accountId: string, facts: Facts) {
        const db = await this.open();
        await this.tx(db, STORE, 'readwrite', (store) => {
            return store.put({ id: accountId, facts, at: Date.now() });
        });
    }

    async get(accountId: string): Promise<Facts | undefined> {
        const db = await this.open();
        const row = await this.tx<{ facts: Facts } | undefined>(db, STORE, 'readonly', (store) => {
            return store.get(accountId);
        });
        return row?.facts;
    }

    async delete(accountId: string) {
        const db = await this.open();
        await this.tx(db, STORE, 'readwrite', (store) => {
            return store.delete(accountId);
        });
        await this.deleteHandle(accountId);
    }

    async putHandle(accountId: string, handle: SourceFileHandle) {
        const db = await this.open();
        await this.tx(db, HANDLE_STORE, 'readwrite', (store) => {
            return store.put({ id: accountId, handle });
        });
    }

    async getHandle(accountId: string): Promise<SourceFileHandle | undefined> {
        const db = await this.open();
        const row = await this.tx<{ handle: SourceFileHandle } | undefined>(db, HANDLE_STORE, 'readonly', (store) => {
            return store.get(accountId);
        });
        return row?.handle;
    }

    async deleteHandle(accountId: string) {
        const db = await this.open();
        await this.tx(db, HANDLE_STORE, 'readwrite', (store) => {
            return store.delete(accountId);
        });
    }

    private open(): Promise<IDBDatabase> {
        if (!this.dbPromise) {
            this.dbPromise = new Promise((resolve, reject) => {
                const req = indexedDB.open(DB_NAME, VERSION);
                req.onupgradeneeded = () => {
                    const db = req.result;
                    if (!db.objectStoreNames.contains(STORE)) {
                        db.createObjectStore(STORE, { keyPath: 'id' });
                    }
                    if (!db.objectStoreNames.contains(HANDLE_STORE)) {
                        db.createObjectStore(HANDLE_STORE, { keyPath: 'id' });
                    }
                };
                req.onsuccess = () => {
                    return resolve(req.result);
                };
                req.onerror = () => {
                    return reject(req.error);
                };
            });
        }
        return this.dbPromise;
    }

    private tx<T>(db: IDBDatabase, storeName: string, mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest): Promise<T> {
        return new Promise((resolve, reject) => {
            const request = run(db.transaction(storeName, mode).objectStore(storeName));
            request.onsuccess = () => {
                return resolve(request.result as T);
            };
            request.onerror = () => {
                return reject(request.error);
            };
        });
    }
}
