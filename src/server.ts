import * as Koa from 'koa';
import * as bodyParser from 'koa-bodyparser';
import * as helmet from 'koa-helmet';
import * as csrf from 'koa-csrf';
import * as views from 'koa-views';
import * as serve from 'koa-static';
import * as cors from '@koa/cors';
import * as session from 'koa-session';
import * as dotenv from 'dotenv';
import { join, basename, resolve } from 'path';
import * as glob from 'glob-promise';

import * as Webpack from 'webpack';
import * as WebpackDevConfig from '../webpack/webpack.dev';
import * as WebpackDevMiddleware from 'webpack-dev-middleware';

import { logger, loggerMiddleware } from './logging';
import { Config } from './config';
import { router } from './routes';

const isDeveloping = process.env.NODE_ENV !== 'production';

const dirViews = resolve(__dirname, 'views/');
const dirPublic = resolve(__dirname, '../public');
const dirPartials = join(dirViews, 'partials/');

// Load environment variables from .env file
dotenv.config({ path: '.env' });

// Returns an object with handlebars partial names as key and path as value
async function getPartialsObj() {
    const partialsPaths = await glob(join(dirPartials + '/*.hbs'));
    const partialsNames = partialsPaths.map((path) => basename(path, '.hbs'));

    // Create an object with name as key and filepath as value
    return partialsNames.reduce((obj, key, i) => ({ ...obj, [key]: partialsPaths[i] }), {});
}

async function run() {
    const app = new Koa();

    // Load dev webpack server if developing
    if (isDeveloping) {
        logger.info('Development Mode');

        const compiler = Webpack(WebpackDevConfig);
        const wd = WebpackDevMiddleware(compiler);
        app.use(async (ctx, next) => {
            wd(ctx.req, ctx.res, resolve);

            await next();
        });

        app.use(serve(resolve(__dirname, '../dist/public')));
    } else {
        logger.info('Production Mode');

        // Provides security headers
        app.use(helmet());

        // Serve the static files in the public directory
        app.use(serve(dirPublic));
    }

    app.use(
        views(dirViews, {
            extension: 'hbs',
            map: {
                hbs: 'handlebars',
            },
            options: {
                partials: await getPartialsObj(),
            },
        }),
    );

    // load the session key from our configuration
    app.keys = [Config.sessionKey];

    // add session support for csrf
    const sessionConfig = {
        key: 'session',
    };
    app.use(session(sessionConfig, app));

    // Enable bodyParser with default options
    app.use(
        bodyParser({
            onerror: function (error, ctx) {
                ctx.throw('Could not parse body of request', 422);
            },
        }),
    );

    app.use(
        new csrf({
            invalidSessionSecretMessage: 'Invalid session secret',
            invalidSessionSecretStatusCode: 403,
            invalidTokenMessage: 'Invalid CSRF token',
            invalidTokenStatusCode: 403,
            excludedMethods: ['GET', 'HEAD', 'OPTIONS'],
            disableQuery: false,
        }),
    );

    // Enable cors with default options
    app.use(cors());

    // Logger middleware -> use winston as logger (logging.ts with config)
    app.use(loggerMiddleware());

    app.use(router.routes()).use(router.allowedMethods());

    app.listen(Config.port);

    logger.info(`Server running on port ${Config.port}`);
}

run();
