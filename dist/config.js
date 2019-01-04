"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = require("dotenv");
dotenv.config({ path: '.env' });
const config = {
    port: +process.env.PORT || 3000,
    debugLogging: process.env.NODE_ENV == 'development',
};
exports.config = config;
//# sourceMappingURL=config.js.map