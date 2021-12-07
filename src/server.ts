import fastify, { FastifyInstance, RouteShorthandOptions } from 'fastify';
import fastifyHelmet from 'fastify-helmet';
import fastifyCors from 'fastify-cors';
import fastifyPov from 'point-of-view';
import fastifyStatic from 'fastify-static';
import fastifyCsrf from 'fastify-csrf';
import fastifySession from 'fastify-session';
import fastifyCookie from 'fastify-cookie';
import * as handlebars from 'handlebars';
import { Server, IncomingMessage, ServerResponse } from 'http';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

import { renderIndex, handleContactForm, serveCaptcha, getIndex } from './controller';
import { Config } from './config';

const isDevelopment = process.env.NODE_ENV !== 'production';

const dirPublic = resolve(__dirname, '../public');

// Load environment variables from .env file
dotenv.config({ path: '.env' });

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

    server.register(fastifyCookie);
    server.register(fastifySession, { secret: Config.sessionKey });
    server.register(fastifyCsrf, { sessionPlugin: 'fastify-session' });

    // Enable cors with default options
    server.register(fastifyCors);

    // GENERAL ROUTES
    // router.get('/', renderIndex);
    // router.post('/', handleContactForm);

    // router.get('/captcha', serveCaptcha);
    server.route({
        method: 'GET',
        path: '/',
        onRequest: server.csrfProtection,
        handler: getIndex,
    });

    server.get<{
        Querystring: PingQuerystring;
        Params: PingParams;
        Headers: PingHeaders;
        Body: PingBody;
    }>('/ping/:bar', opts, (request, reply) => {
        console.log(request.query); // this is of type `PingQuerystring`
        console.log(request.params); // this is of type `PingParams`
        console.log(request.headers); // this is of type `PingHeaders`
        console.log(request.body); // this is of type `PingBody`
        reply.code(200).send({ pong: 'it worked!' });
    });

    server.listen(8080, (err, address) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }

        logger.info(`Server running on ${address}`);
    });
}

run();
