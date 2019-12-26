import * as Keyv from 'keyv';
import { Captcha, ExtendedContext } from './interfaces';
import { logger } from './logging';

export interface StoreOptions {
    entryTTL: number;
}
export default class Store {
    private readonly options: StoreOptions;
    constructor( options: StoreOptions ) {
        this.options = options;
        return this.middleware.bind( this );
    }
    middleware ( ctx: ExtendedContext, next ) {
        if ( !ctx._store ) {
            ctx._store = new Keyv( {
                ttl: this.options.entryTTL,
            } );
        }

        ctx.getCaptcha = ( csrf: string ): Promise<string> => {
            logger.debug( `get ${csrf}` );
            return ctx._store.get( csrf );
        };

        ctx.setCaptcha = ( csrf: string, captcha: Captcha ): Promise<true> => {
            logger.debug( `set ${csrf}, ${captcha.string}` );
            return ctx._store.set( csrf, captcha.string );
        };

        ctx.deleteCaptcha = ( csrf: string ): Promise<boolean> => {
            logger.debug( `del ${csrf}` );
            return ctx._store.delete( csrf );
        };

        return next();
    }
}