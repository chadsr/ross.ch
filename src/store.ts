import { Captcha, ExtendedContext } from './interfaces';
import { logger } from './logging';
import * as Keyv from 'keyv';

export default class Store {
    private readonly store: Keyv;
    constructor( store: Keyv ) {
        this.store = store;
        return this.middleware.bind( this );
    }
    middleware ( ctx: ExtendedContext, next ) {
        ctx.getCaptcha = ( csrf: string ): Promise<string> => {
            return this.store.get( csrf );
        };

        ctx.setCaptcha = ( csrf: string, captcha: Captcha ): Promise<true> => {
            return this.store.set( csrf, captcha.string );
        };

        ctx.deleteCaptcha = ( csrf: string ): Promise<boolean> => {
            // Keep the csrf for now with non-undefined value (empty string), to handle requesting of new captcha route
            // If this was set to undefined, if would be unclear if the csrf key existed
            return this.store.set( csrf, '' );
        };

        return next();
    }
}