import Dexie, { Table } from 'dexie';
import { isStoragePersisted, persist } from './persistance';
import { ParseqDoc, ParseqDocVersion } from './ParseqUI';
import { UserSetting } from './UserSettings';

export class ParseqDexie extends Dexie {
    parseqVersions!: Table<ParseqDocVersion>;
    parseqDocs!: Table<ParseqDoc>;
    parseqUserSettings!: Table<UserSetting>;

    constructor() {
        super('parseqDB');
        this.version(1).stores({
            parseqVersions: 'versionId, docId, timestamp',
            parseqDocs: 'docId, name'
        });
        this.version(2).stores({
            parseqVersions: 'versionId, docId, timestamp',
            parseqDocs: 'docId, name, timestamp, latestVersionId'
        });
        this.version(6).stores({
            parseqVersions: 'versionId, docId, timestamp',
            parseqDocs: 'docId, name, timestamp, latestVersionId',
            parseqUserSettings: 'name'
        });          
    }
}

export const db = new ParseqDexie();

db.parseqDocs.count().then(async (count : any) => {
    if (count > 3 && !(await isStoragePersisted())) {
        persist().then( async (e : any) => {
        console.log("Is DB persisted?", await isStoragePersisted());
        });
    }
});