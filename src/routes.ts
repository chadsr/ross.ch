import * as Router from '@koa/router';
import controller = require( './controller' );

const router = new Router();

// GENERAL ROUTES
router.get( '/', controller.renderIndex );
router.post( '/', controller.handleContactForm );

export { router };