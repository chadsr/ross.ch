import { IRouterContext } from 'koa-router';
import to from 'await-to-js';
import * as Joi from 'joi';

import { logger } from '../logging';
import { config } from '../config';
import { contactMailer } from '../mailer';
import { Response, Message } from '../interfaces';

const contactFormSchema = Joi.object().keys({
  name: Joi.string().alphanum().min(2).max(32).required().error(() => 'A more meaningful name would be great.'),
  email: Joi.string().email(({ minDomainAtoms: 2 })).required().error(() => 'Your email looks invalid :('),
  message: Joi.string().min(2).required().error(() => 'A more meaningful message would be great.')
});

function getResponseObj(success: boolean, msg: (Message|Message[])): Response {
  // If we were passed a single Message object, put it in an array for standardisation
  if (!Array.isArray(msg)) {
    msg = [msg];
  }

  return {
    success: success,
    messages: msg,
  };
}

// Validated data objects against a Joi schema, returning errors in a Message[] format
function validateData(data: Object, schema: Joi.ObjectSchema): Message[] {
  const res = Joi.validate(data, schema);
  const errors: Message[] = [];

  if (res.error) {
    res.error.details.forEach((errorItem) => {
      errors.push({
        target: errorItem.context.key,
        text: errorItem.message
      });
    });
  }

  return errors;
}

export async function renderIndex (ctx: IRouterContext) {
  await ctx.render('index', {
    title: 'Ross Chadwick',
    csrfToken: ctx.csrf // Add a CSRF token for the contact form request
  });
}

export async function handleContactForm (ctx: IRouterContext) {
  logger.debug('Mail received:', ctx.request.body);

  const validationErrors = validateData(ctx.request.body, contactFormSchema);
  if (validationErrors.length > 0) {
    // Validation against the schema failed, so respond with 422 status and relevant errors
    ctx.status = 422;
    ctx.body = getResponseObj(false, validationErrors);
    return;
  }

  const fromAddress = <string>ctx.request.body.email;
  const name = <string>ctx.request.body.name;
  const message = <string>ctx.request.body.msg;
  const remoteIp = <string>ctx.request.ip;

  // Construct the email from the request body
  const subject = `Ross.ch - New message from ${name} (${remoteIp})`;
  const text = `Name: ${name}</br>IP: ${remoteIp}</br></br>Message:${message}`;

  const [ err ] = await to(contactMailer.send(fromAddress, config.emailAddress, subject, text));
  if (err) {
    // Return a 503 error if we couldn't deliver the email for some reason
    logger.error('Could not send contact form email:', err);
    ctx.status = 503;
    ctx.body = getResponseObj(false, {text: 'Email server unavailable. Try again later.'});
  } else {
    // Return a 200 status and message
    logger.info('Contact form email sent!');
    ctx.status = 200;
    ctx.body = getResponseObj(true, {text: 'Email sent successfully!'});
  }
}