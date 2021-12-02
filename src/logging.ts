import * as Koa from 'koa';
import { Config } from './config';
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
    level: Config.debugLogging ? 'debug' : 'info',
    transports: [
        // Write errors to error.log
        new transports.File({ filename: 'error.log', level: 'error' }),

        new transports.File({ filename: 'debug.log', level: 'debug' }),

        // Write colourised logs to console, according to the given level value
        new transports.Console({
            format: format.combine(format.colorize(), format.simple()),
        }),
    ],
});

function loggerMiddleware() {
    return async (ctx: Koa.Context, next: Koa.Next): Promise<void> => {
        const start = new Date().getMilliseconds();

        await next();

        const ms = new Date().getMilliseconds() - start;

        let logLevel = 'info';
        if (ctx.status >= 500) {
            logLevel = 'error';
        } else if (ctx.status >= 400) {
            logLevel = 'warn';
        }

        const msg = `${ctx.method} ${ctx.originalUrl} ${ctx.status} ${ms}ms`;

        logger.log(logLevel, msg);
    };
}

export { logger, loggerMiddleware };
