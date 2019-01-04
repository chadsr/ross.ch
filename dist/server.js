"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Koa = require("koa");
const bodyParser = require("koa-bodyparser");
const helmet = require("koa-helmet");
const csrf = require("koa-csrf");
const cors = require("@koa/cors");
const hbs = require("koa-hbs-renderer");
const winston = require("winston");
const dotenv = require("dotenv");
require("reflect-metadata"); // TODO: Check if useful
const path = require("path");
const webpack = require("webpack");
const koaWebpack = require("koa-webpack");
const logging_1 = require("./logging");
const config_1 = require("./config");
const routes_1 = require("./routes");
const webpackConfig = require("../webpack.config.js");
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
    }
    else {
        console.log('\nProduction Mode.\n');
    }
    // Run the webpack compiler to get the static files to serve
    compiler.run((err, stats) => {
        if (err) {
            console.log('Webpack Error:', err);
            return; // Just exit, since we depend on webpack
        }
        else {
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
        },
        defaultLayout: 'main',
        extension: '.hbs',
    }));
    // Provides security headers
    app.use(helmet());
    app.use(new csrf({
        invalidSessionSecretMessage: 'Invalid session secret',
        invalidSessionSecretStatusCode: 403,
        invalidTokenMessage: 'Invalid CSRF token',
        invalidTokenStatusCode: 403,
        excludedMethods: ['GET', 'HEAD', 'OPTIONS'],
        disableQuery: false
    }));
    // Enable cors with default options
    app.use(cors());
    // Logger middleware -> use winston as logger (logging.ts with config)
    app.use(logging_1.logger(winston));
    // Enable bodyParser with default options
    app.use(bodyParser());
    app.use(routes_1.router.routes()).use(routes_1.router.allowedMethods());
    app.listen(config_1.config.port);
    console.log(`Server running on port ${config_1.config.port}`);
}
run();
//# sourceMappingURL=server.js.map