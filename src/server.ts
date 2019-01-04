import * as Koa from 'koa';
import * as bodyParser from 'koa-bodyparser';
import * as helmet from 'koa-helmet';
import * as csrf from  'koa-csrf';
import * as views from 'koa-views';
import * as cors from '@koa/cors';
import * as hbs from 'koa-hbs-renderer';
import * as winston from 'winston';
import * as dotenv from 'dotenv';
import 'reflect-metadata'; // TODO: Check if useful
import * as path from 'path';
import * as webpack from 'webpack';
import * as koaWebpack from 'koa-webpack';

import { logger } from './logging';
import { config } from './config';
import { router } from './routes';

import webpackConfig = require('../webpack.config.js');
import { runInContext } from 'vm';
const compiler = webpack(webpackConfig);

const isDeveloping = process.env.NODE_ENV !== 'production';

// const publicDir = path.join(__dirname, 'public');
const viewsDir = path.join(__dirname, 'views');
const partialsDir = path.join(viewsDir, 'partials');
const layoutsDir = path.join(viewsDir, 'layouts');

// Load environment variables from .env file
dotenv.config({ path: '.env' });

async function run() {
    const app = new Koa();

    // Load dev middlewares if developing
    if (isDeveloping) {
        console.log('\nDevelopment Mode.\n');

        const webpackMiddleware = await koaWebpack({ compiler });

        app.use(webpackMiddleware);
        // app.use(logger('dev'));
    } else {
        console.log('\nProduction Mode.\n');
    }

    // Run the webpack compiler to get the static files to serve
    compiler.run((err, stats) => {
        if (err) {
            console.log('Webpack Error:', err);
            return; // Just exit, since we depend on webpack
        } else {
            console.log('Webpack compiled successfully!');
        }
    });

    // app.use(
    //     views(viewsDir, {
    //         extension: 'hbs',
    //         map: {
    //             hbs: 'handlebars',
    //         }
    //     })
    // );

    app.use(hbs({
        paths: {
            views: viewsDir,
            layouts: layoutsDir,
            partials: partialsDir,
            // helpers:
        },
        defaultLayout: 'main',
        extension: '.hbs',
    }));

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

    // Enable bodyParser with default options
    app.use(bodyParser());

    app.use(router.routes()).use(router.allowedMethods());

    app.listen(config.port);

    console.log(`Server running on port ${config.port}`);
}

run();