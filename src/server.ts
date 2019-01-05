import * as Koa from 'koa';
import * as bodyParser from 'koa-bodyparser';
import * as helmet from 'koa-helmet';
import * as csrf from  'koa-csrf';
import * as views from 'koa-views';
import * as cors from '@koa/cors';
import * as session from 'koa-session';
import * as winston from 'winston';
import * as dotenv from 'dotenv';
import 'reflect-metadata'; // TODO: Check if useful
import { join, basename } from 'path';
import * as glob from 'glob-promise'; // TODO: Investigate why tiny-glob is borked
import * as webpack from 'webpack';
import * as koaWebpack from 'koa-webpack';

import { logger } from './logging';
import { config } from './config';
import { router } from './routes';

import webpackConfig = require('../webpack.config.js');
const compiler = webpack(webpackConfig);

const isDeveloping = process.env.NODE_ENV !== 'production';

const dirViews = join(__dirname, 'views');
const dirPartials = join(dirViews, 'partials');

// Load environment variables from .env file
dotenv.config({ path: '.env' });

async function getPartialsObj() {
    const partialsPaths = await glob(join(dirPartials + '/*.hbs'));
    const partialsNames = partialsPaths.map(path => basename(path, '.hbs'));

    // Create an object with name as key and filepath as value
    const partialsObj = partialsNames.reduce((obj, key, i) => (
        {...obj, [key]: partialsPaths[i]}), {});

    return partialsObj;
}

async function run() {
    const app = new Koa();

    // Load dev webpack middlewares if developing
    if (isDeveloping) {
        console.log('\nDevelopment Mode.\n');

        const webpackMiddleware = await koaWebpack({ compiler });

        app.use(webpackMiddleware);
    } else {
        console.log('\nProduction Mode.\n');

        // Run the webpack compiler to get the static files to serve
        compiler.run((err, stats) => {
            if (err) {
                console.log('Webpack Error:', err);
                return; // Just exit, since we depend on webpack
            } else {
                console.log('Webpack compiled successfully!');
            }
        });
    }

    app.use(
        views(dirViews, {
            extension: 'hbs',
            map: {
                hbs: 'handlebars',
            },
            options: {
                partials: await getPartialsObj()
            },
        })
    );

    // load the session key from our configuration
    app.keys = [config.sessionKey];

    // add session support
    app.use(session(app));

    // Enable bodyParser with default options
    app.use(bodyParser());

    // Provides security headers
    app.use(helmet());

    app.use(
        new csrf({
            invalidSessionSecretMessage: 'Invalid session secret',
            invalidSessionSecretStatusCode: 403,
            invalidTokenMessage: 'Invalid CSRF token',
            invalidTokenStatusCode: 403,
            excludedMethods: [ 'GET', 'HEAD', 'OPTIONS' ],
            disableQuery: false
        })
    );

    // Enable cors with default options
    app.use(cors());

    // Logger middleware -> use winston as logger (logging.ts with config)
    app.use(logger(winston));

    app.use(router.routes()).use(router.allowedMethods());

    app.listen(config.port);

    console.log(`Server running on port ${config.port}`);
}

run();