import Dexie from 'dexie';
import { Table } from 'dexie';

export class ParseqDexie extends Dexie {
    parseqVersions!: Table<ParseqDocVersion>;
    parseqDocs!: Table<ParseqDoc>;

    constructor() {
        super('parseqDB');
        this.version(1).stores({
            parseqVersions: 'versionId, docId, timestamp, latestVersionId',
            parseqDocs: 'docId, name'
        });
        this.version(2).stores({
            parseqVersions: 'versionId, docId, timestamp',
            parseqDocs: 'docId, name, timestamp'
        });        
    }
}
export const db = new ParseqDexie();