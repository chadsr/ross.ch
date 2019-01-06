import * as Koa from 'koa';
import { config } from './config';
import { Logger, createLogger, format, transports } from 'winston';

const logger = createLogger({
    level: config.debugLogging ? 'debug' : 'info',
    transports: [
        //
        // - Write all logs error (and below) to `error.log`.
        new transports.File({ filename: 'error.log', level: 'error' }),
        //
        // - Write to all logs with specified level to console.
        new transports.Console({ format: format.combine(
            format.colorize(),
            format.simple()
        ) })
    ]
});

export function loggerMiddleware() {
    return async(ctx: Koa.Context, next: () => Promise<any>) => {

        const start = new Date().getMilliseconds();

        await next();

        const ms = new Date().getMilliseconds() - start;

        let logLevel: string;
        if (ctx.status >= 500) {
            logLevel = 'error';
        }
        if (ctx.status >= 400) {
            logLevel = 'warn';
        }
        if (ctx.status >= 100) {
            logLevel = 'info';
        }

        const msg: string = `${ctx.method} ${ctx.originalUrl} ${ctx.status} ${ms}ms`;

        logger.log(logLevel, msg);
    };
}

export { logger };