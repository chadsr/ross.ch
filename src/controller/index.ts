import { IRouterContext } from 'koa-router';
import to from 'await-to-js';
import * as Joi from 'joi';

import { logger } from '../logging';
import { config } from '../config';
import { Response, Message } from '../interfaces';
import { contactMailer } from '../mailer';
import { getAggregatedFeed } from '../blog';
import { getUserReposWithStars } from '../github';

const contactFormSchema = Joi.object().keys({
  name: Joi.string().alphanum().min(2).max(32).required().error(() => 'Name is a little short...'),
  email: Joi.string().email(({ minDomainAtoms: 2 })).required().error(() => 'Email looks invalid :('),
  message: Joi.string().min(2).required().error(() => 'Message is a little short...')
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
  const res = Joi.validate(data, schema, { abortEarly : false });
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
  const feed = await getAggregatedFeed(config.maxBlogPosts);
  let posts = feed.posts;
  if (posts.length < 1) {
    posts = undefined;
  }
  const github = await getUserReposWithStars(config.githubUser, true, config.maxRepos, 'updated');
  let repositories = github.repositories;
  if (repositories.length < 1) {
    repositories = undefined;
  }

  const year = new Date().getFullYear().toString();

  await ctx.render('index', {
    year: year,
    csrfToken: ctx.csrf, // Add a CSRF token for the contact form request
    blogPosts: posts,
    githubRepos: repositories
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
    ctx.body = getResponseObj(false, {
      text: 'Server failure. Try later?',
      target: 'submit'
    });
  } else {
    // Return a 200 status and message
    logger.info('Contact form email sent!');
    ctx.status = 200;
    ctx.body = getResponseObj(true, {
      text: 'Success!',
      target: 'submit'
    });
  }
}