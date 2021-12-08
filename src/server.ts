import fastify, { FastifyInstance } from 'fastify';
import fastifyHelmet from 'fastify-helmet';
import fastifyCors from 'fastify-cors';
import fastifyPov from 'point-of-view';
import fastifyStatic from 'fastify-static';
import fastifyCsrf from 'fastify-csrf';
import fastifyCookie from 'fastify-cookie';
import fastifySession from '@fastify/session';
import fastifyExpress from 'fastify-express';
import * as handlebars from 'handlebars';
import { Server, IncomingMessage, ServerResponse } from 'http';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

import * as webpack from 'webpack';
import * as webpackDev from 'webpack-dev-middleware';

import { getIndex, postContact } from './controller/index';
import { getCaptcha } from './controller/captcha';
import { Config } from './config';
import devConfig from '../webpack/webpack.dev';

const publicPath = resolve(__dirname, '../public');

// Load environment variables from .env file
dotenv.config({ path: '.env' });

async function run() {
    const server: FastifyInstance<Server, IncomingMessage, ServerResponse> = fastify({
        logger: {
            prettyPrint: !Config.production ? { translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' } : false,
        },
    });

    if (Config.production) {
        server.log.info('Production Mode');

        // security headers
        await server.register(fastifyHelmet);

        // serve the static files in the public directory
        await server.register(fastifyStatic, {
            root: publicPath,
        });
    } else {
        server.log.info('Development Mode');

        await server.register(fastifyExpress);
        const compiler = webpack(devConfig);
        server.use(webpackDev(compiler, { publicPath }));
    }

    // template rendering
    await server.register(fastifyPov, {
        engine: {
            handlebars: handlebars,
        },
    });

    // sessions
    await server.register(fastifyCookie);
    await server.register(fastifySession, { secret: Config.sessionKey });
    await server.register(fastifyCsrf, { sessionPlugin: 'fastify-session' });

    // Enable cors with default options
    await server.register(fastifyCors);

    // Routes
    // TODO: create schema
    server.get('/', {}, getIndex);

    server.post('/contact', { onRequest: server.csrfProtection }, postContact);

    server.get('/captcha', { onRequest: server.csrfProtection }, getCaptcha);

    server.listen(8080, (err) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
    });
}

run();
