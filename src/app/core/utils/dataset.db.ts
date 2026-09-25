import { Injectable } from '@angular/core';
import { Facts } from '../types';

const DB_NAME = 'codepulse';
const STORE = 'datasets';
const VERSION = 1;

@Injectable({ providedIn: 'root' })
export class DatasetDb {
    private dbPromise?: Promise<IDBDatabase>;

    async put(accountId: string, facts: Facts) {
        const db = await this.open();
        await this.tx(db, 'readwrite', (store) => {
            return store.put({ id: accountId, facts, at: Date.now() });
        });
    }

    async get(accountId: string): Promise<Facts | undefined> {
        const db = await this.open();
        const row = await this.tx<{ facts: Facts } | undefined>(db, 'readonly', (store) => {
            return store.get(accountId);
        });
        return row?.facts;
    }

    async delete(accountId: string) {
        const db = await this.open();
        await this.tx(db, 'readwrite', (store) => {
            return store.delete(accountId);
        });
    }

    private open(): Promise<IDBDatabase> {
        if (!this.dbPromise) {
            this.dbPromise = new Promise((resolve, reject) => {
                const req = indexedDB.open(DB_NAME, VERSION);
                req.onupgradeneeded = () => {
                    if (!req.result.objectStoreNames.contains(STORE)) {
                        req.result.createObjectStore(STORE, { keyPath: 'id' });
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

    private tx<T>(db: IDBDatabase, mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest): Promise<T> {
        return new Promise((resolve, reject) => {
            const request = run(db.transaction(STORE, mode).objectStore(STORE));
            request.onsuccess = () => {
                return resolve(request.result as T);
            };
            request.onerror = () => {
                return reject(request.error);
            };
        });
    }
}
