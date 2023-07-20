import { db } from './db';

export type UserSetting = {
    name: string,
    value: any
}

export class UserSettings {

    static setColorScheme(scheme : string) {
        db.parseqUserSettings.put({name:"colorScheme", value: scheme}, "colorScheme").catch((e) => {
            console.error("Error saving setting: ", e);
        })
    }

    static async getColorScheme() : Promise<string | undefined> {
        const colorSchemeSetting = await db.parseqUserSettings.get('colorScheme');
        return colorSchemeSetting?.value;
    }

}