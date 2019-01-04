"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Router = require("koa-router");
const controller = require("./controller");
const router = new Router();
exports.router = router;
// GENERAL ROUTES
router.get('/', controller.renderIndex);
router.post('/', controller.handleContactForm);
//# sourceMappingURL=routes.js.map