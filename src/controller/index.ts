import * as Joi from '@hapi/joi';

import { logger } from '../logging';
import { config } from '../config';
import { ExtendedContext, Response, Message } from '../interfaces';
import { contactMailer, Email } from '../mailer';
import { getAggregatedFeed } from '../blog';
import { getUserReposWithStars } from '../github';
import { errors } from '../errors';
import { getCaptcha } from '../captcha';

const contactFormSchema = Joi.object().keys( {
    name: Joi.string().min( 2 ).max( 32 ).required().error( () => errors.InvalidName ),
    email: Joi.string().email( ( { minDomainSegments: 2 } ) ).required().error( () => errors.InvalidEmail ),
    message: Joi.string().min( 2 ).required().error( () => errors.InvalidMsg ),
    captcha: Joi.string().min( config.captchaLength ).max( config.captchaLength ).required().error( () => errors.InvalidCaptcha ),
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
    const { error, value } = contactFormSchema.validate( data );
    const errors: Message[] = [];
    if ( error ) {
        errors.push( {
            target: error.name,
            text: error.message,
        } );
    }

    return errors;
}

export async function renderIndex ( ctx: ExtendedContext ) {
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

    // Get a captcha object
    const captcha = await getCaptcha( config.captchaLength, config.captchaFontSize );

    try {
        ctx.setCaptcha( ctx.csrf, captcha );
    } catch ( error ) {
        logger.error( `Failed to store captcha: ${error}` );
    }

    await ctx.render( 'index', {
        year: year,
        csrfToken: ctx.csrf, // Add a CSRF token for the contact form request
        blogPosts: posts,
        githubRepos: repositories,
        captchaBase64: captcha.base64,
    } );
}

export async function handleContactForm ( ctx: ExtendedContext ) {
    const captchaSent: string = ctx.request.body.captcha.toUpperCase();
    const csrf = ctx.request.headers[ 'x-csrf-token' ];

    const validationErrors = validateData( ctx.request.body, contactFormSchema );
    if ( validationErrors.length > 0 ) {
        // Validation against the schema failed, so respond with 422 status and relevant errors
        ctx.status = 422;
        ctx.body = getResponseObj( false, validationErrors );

        try {
            ctx.deleteCaptcha( csrf );
        } catch ( error ) {
            logger.error( `Failed to delete csrf/captcha key/value: ${error}` );
        }

        return;
    }

    try {
        const captchaString = await ctx.getCaptcha( csrf );

        // Delete the captcha value from the store after getting the string, so it can only be used with this csrf token once
        try {
            ctx.deleteCaptcha( csrf );
        } catch ( error ) {
            logger.error( `Failed to delete csrf/captcha key/value: ${error}` );
            ctx.status = 500;
            return;
        }

        if ( captchaSent !== captchaString ) {
            logger.warn( `Captcha didn't match. Got ${captchaSent}, expected ${captchaString}` );

            // Captcha didn't match, so return 401
            ctx.status = 401;
            ctx.body = getResponseObj( false, {
                target: 'submit',
                text: errors.InvalidCaptcha.message,
            } );
            return;
        }
    } catch ( error ) {
        logger.error( `Failed to get captcha matching csrf token: ${error}` );
        ctx.status = 401;
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
    } catch ( error ) {
        // Return a 503 error if we couldn't deliver the email for some reason
        logger.error( 'Could not send contact form email:', error );
        ctx.status = 503;
        ctx.body = getResponseObj( false, {
            text: 'Server failure. Try later?',
            target: 'submit'
        } );
    }
}

export async function serveCaptcha ( ctx: ExtendedContext ) {
    const captcha = await getCaptcha( config.captchaLength, config.captchaFontSize );

    const csrf = ctx.headers[ 'x-csrf-token' ];
    if ( csrf !== undefined ) {
        // Check if the provided csrf value exists in the store (e.g. it was actually served and is not a random value)
        const existingCaptcha = await ctx.getCaptcha( csrf );
        if ( existingCaptcha === '' ) {
            // New captcha requested from existing csrf, so store it in the key/value store again
            try {
                ctx.setCaptcha( csrf, captcha );
            } catch ( error ) {
                logger.error( `Failed to store captcha: ${error} ` );
            }

            ctx.status = 200;
            ctx.body = getResponseObj( true, {
                text: captcha.base64,
            } );

            return;
        }
    }

    // The csrf was not recognised / was not provided
    ctx.status = 401;
}