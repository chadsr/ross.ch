import * as Router from '@koa/router';
import controller = require( './controller' );

const router = new Router();

// GENERAL ROUTES
router.get( '/', <any> controller.renderIndex );
router.post( '/', <any> controller.handleContactForm );

export { router };