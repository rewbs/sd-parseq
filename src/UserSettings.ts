import { db } from './db';

export type UserSetting = {
    name: string,
    value: any
}

export class UserSettings {

    static setDarkMode(darkMode : boolean) {
        db.parseqUserSettings.put({name:"darkMode", value: darkMode}, "darkMode").catch((e) => {
            console.error("Error saving setting: ", e);
        }).then(() => {
            console.debug("Dark mode setting saved");
        }).finally(() => {
            console.debug("Dark mode setting save logic compled");
        })
    }

    static async getDarkMode() : Promise<boolean | undefined> {
        const darkModeSetting = await db.parseqUserSettings.get('darkMode');
        return darkModeSetting?.value;
    }

}