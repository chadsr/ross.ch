import * as Keyv from 'keyv';

import { Captcha } from './interfaces';
import { Config } from './config';
// TODO: Make this interface with Middleware interface
export class CaptchaStore {
    private readonly _store: Keyv;
    constructor() {
        this._store = new Keyv({
            ttl: Config.csrfExpiryMs,
        });
    }

    getCaptcha = (csrf: string): Promise<string> => {
        return this._store.get(csrf);
    };

    setCaptcha = (csrf: string, captcha: Captcha): Promise<true> => {
        return this._store.set(csrf, captcha.string);
    };

    deleteCaptcha = (csrf: string): Promise<true> => {
        // Keep the csrf for now with non-undefined value (empty string), to handle requesting of new captcha route
        // If this was set to undefined, if would be unclear if the csrf key existed
        return this._store.set(csrf, '');
    };
}
