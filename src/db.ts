import Dexie, { Table } from 'dexie';

export class ParseqDexie extends Dexie {
    parseqVersions!: Table<ParseqDocVersion>;
    parseqDocs!: Table<ParseqDoc>;

    constructor() {
        super('parseqDB');
        this.version(1).stores({
            parseqVersions: 'versionId, docId, timestamp',
            parseqDocs: 'docId, name'
        });
    }
}
export const db = new ParseqDexie();