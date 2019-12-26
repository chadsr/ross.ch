import * as Joi from '@hapi/joi';
import { RouterContext } from '@koa/router';

import { logger } from '../logging';
import { config } from '../config';
import { Response, Message } from '../interfaces';
import { contactMailer, Email } from '../mailer';
import { getAggregatedFeed } from '../blog';
import { getUserReposWithStars } from '../github';
import { errors } from '../errors';

const contactFormSchema = Joi.object().keys( {
  name: Joi.string().min( 2 ).max( 32 ).required().error( () => errors.invalidName ),
  email: Joi.string().email( ( { minDomainSegments: 2 } ) ).required().error( () => errors.invalidEmail ),
  message: Joi.string().min( 2 ).required().error( () => errors.invalidMsg )
} );

function getResponseObj ( success: boolean, msg: ( Message | Message[] ) ): Response {
  // If we were passed a single Message object, put it in an array for standardisation
  if ( !Array.isArray( msg ) ) {
    msg = [ msg ];
  }

  return {
    success: success,
    messages: msg,
  };
}

// Validated data objects against a Joi schema, returning errors in a Message[] format
function validateData ( data: Object, schema: Joi.ObjectSchema ): Message[] {
  const res = Joi.validate( data, schema, { abortEarly: false } );
  const errors: Message[] = [];

  if ( res.error ) {
    res.error.details.forEach( ( errorItem ) => {
      errors.push( {
        target: errorItem.context.key,
        text: errorItem.message
      } );
    } );
  }

  return errors;
}

export async function renderIndex ( ctx: RouterContext ) {
  const feed = await getAggregatedFeed( config.maxBlogPosts );
  let posts = feed.posts;
  if ( posts.length < 1 ) {
    posts = undefined;
  }
  const github = await getUserReposWithStars( config.githubUser, true, config.maxRepos, 'updated' );
  let repositories = github.repositories;
  if ( repositories.length < 1 ) {
    repositories = undefined;
  }

  const year = new Date().getFullYear().toString();

  await ctx.render( 'index', {
    year: year,
    csrfToken: ctx.csrf, // Add a CSRF token for the contact form request
    blogPosts: posts,
    githubRepos: repositories
  } );
}

export async function handleContactForm ( ctx: RouterContext ) {
  logger.debug( 'Mail received:', ctx.request.body );

  const validationErrors = validateData( ctx.request.body, contactFormSchema );
  if ( validationErrors.length > 0 ) {
    // Validation against the schema failed, so respond with 422 status and relevant errors
    ctx.status = 422;
    ctx.body = getResponseObj( false, validationErrors );
    return;
  }

  // Construct email object from the request body
  const formEmail = <Email> {
    senderName: ctx.request.body.name,
    senderAddress: ctx.request.body.email,
    text: ctx.request.body.message
  };

  try {
    await contactMailer.send( config.sendEmailAddress, config.recvEmailAddress, formEmail, true );
    // Return a 200 status and message
    logger.info( 'Contact form email sent!' );
    ctx.status = 200;
    ctx.body = getResponseObj( true, {
      text: 'Success!',
      target: 'submit'
    } );
  }
  catch ( err ) {
    // Return a 503 error if we couldn't deliver the email for some reason
    logger.error( 'Could not send contact form email:', err );
    ctx.status = 503;
    ctx.body = getResponseObj( false, {
      text: 'Server failure. Try later?',
      target: 'submit'
    } );
  }
}