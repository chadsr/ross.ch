import * as Router from '@koa/router';
import { renderIndex, handleContactForm, serveCaptcha } from './controller';

const router = new Router();

// GENERAL ROUTES
router.get('/', renderIndex);
router.post('/', handleContactForm);

router.get('/captcha', serveCaptcha);

export { router };
