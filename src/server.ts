import fastify, { FastifyInstance, RouteShorthandOptions } from 'fastify';
import fastifyHelmet from 'fastify-helmet';
import fastifyCors from 'fastify-cors';
import fastifyPov from 'point-of-view';
import fastifyStatic from 'fastify-static';
import fastifyCsrf from 'fastify-csrf';
import fastifySession from 'fastify-session';
import fastifyCookie from 'fastify-cookie';
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

const isDevelopment = process.env.NODE_ENV !== 'production';

const publicPath = resolve(__dirname, '../public');

// Load environment variables from .env file
dotenv.config({ path: '.env' });

async function run() {
    const server: FastifyInstance<Server, IncomingMessage, ServerResponse> = fastify({
        logger: {
            prettyPrint: isDevelopment ? { translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' } : false,
        },
    });

    if (isDevelopment) {
        server.log.info('Development Mode');

        // Load dev webpack dev middleware
        await server.register(fastifyExpress);
        const compiler = webpack(devConfig);
        server.use(webpackDev(compiler, { publicPath }));
    } else {
        server.log.info('Production Mode');

        // Provides security headers
        await server.register(fastifyHelmet);

        // Serve the static files in the public directory
        await server.register(fastifyStatic, {
            root: publicPath,
        });
    }

    await server.register(fastifyPov, {
        engine: {
            handlebars: handlebars,
        },
    });

    await server.register(fastifyCookie);
    await server.register(fastifySession, { secret: Config.sessionKey });
    await server.register(fastifyCsrf, { sessionPlugin: 'fastify-session' });

    // Enable cors with default options
    await server.register(fastifyCors);

    // Routes
    // TODO: create schema
    const getIndexOpts: RouteShorthandOptions = {
        onRequest: server.csrfProtection,
    };
    server.get('/', getIndexOpts, getIndex);

    const postContactOpts: RouteShorthandOptions = {
        onRequest: server.csrfProtection,
    };
    server.post('/contact', postContactOpts, postContact);

    const getCaptchaOpts: RouteShorthandOptions = {
        onRequest: server.csrfProtection,
    };

    server.get('/captcha', getCaptchaOpts, getCaptcha);

    server.listen(8080, (err) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
    });
}

run();
