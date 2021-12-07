import fastify, { FastifyInstance, RouteShorthandOptions } from 'fastify';
import fastifyHelmet from 'fastify-helmet';
import fastifyCors from 'fastify-cors';
import fastifyPov from 'point-of-view';
import fastifyStatic from 'fastify-static';
import fastifyCsrf from 'fastify-csrf';
import * as handlebars from 'handlebars';
import { Server, IncomingMessage, ServerResponse } from 'http';
import * as dotenv from 'dotenv';
import { join, basename, resolve } from 'path';
import * as glob from 'glob-promise';

import { Config } from './config';
import { router } from './routes';

const isDevelopment = process.env.NODE_ENV !== 'production';

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
    const server: FastifyInstance<Server, IncomingMessage, ServerResponse> = fastify({
        logger: {
            prettyPrint: isDevelopment ? { translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' } : false,
        },
    });

    if (isDevelopment) {
        logger.info('Development Mode');

        // Load dev webpack dev middleware
    } else {
        logger.info('Production Mode');

        // Provides security headers
        server.register(fastifyHelmet);
    }

    // Serve the static files in the public directory
    server.register(fastifyStatic, {
        root: dirPublic,
    });

    server.register(fastifyPov, {
        engine: {
            handlebars: handlebars,
        },
    });

    // app.use(
    //     views(dirViews, {
    //         extension: 'hbs',
    //         map: {
    //             hbs: 'handlebars',
    //         },
    //         options: {
    //             partials: await getPartialsObj(),
    //         },
    //     }),
    // );

    // // Enable bodyParser with default options
    // app.use(
    //     bodyParser({
    //         onerror: function (error, ctx) {
    //             ctx.throw('Could not parse body of request', 422);
    //         },
    //     }),
    // );

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
    server.register(fastifyCors);

    server.listen(8080, (err, address) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }

        logger.info(`Server running on ${address}`);
    });
}

run();
