import * as Joi from '@hapi/joi';

import { logger } from '../logging';
import { Config } from '../config';
import { ExtendedContext, Response, ResponseMessage, ContactFormRequest, ValidatedFormData } from '../interfaces';
import { contactMailer, Email } from '../mailer';
import { getAggregatedFeed } from '../blog';
import { getUserReposWithStars } from '../github';
import { ErrorMessages } from '../errors';
import { getCaptcha } from '../captcha';



const contactFormSchema = Joi.object().options({ abortEarly: false }).keys( {
    name: Joi.string().min( Config.minNameLength ).max( Config.maxNameLength ).required().messages({
        'string.min': ErrorMessages.InvalidNameShort,
        'string.max': ErrorMessages.InvalidNameLong}),
    email: Joi.string().email( ( { minDomainSegments: Config.minEmailDomainSegments } ) ).required().messages({
        'string.email': ErrorMessages.InvalidEmail
    }),
    message: Joi.string().min( Config.minMessageLength ).required().messages({
        'string.min': ErrorMessages.InvalidMsg
    }),
    captcha: Joi.string().min( Config.captchaLength ).max( Config.captchaLength ).required().messages({
        'string.min': ErrorMessages.InvalidCaptcha,
        'string.max': ErrorMessages.InvalidCaptcha
    })
} );

function getResponseObj ( success: boolean, msg: ( ResponseMessage | ResponseMessage[] ) ): Response {
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
function validateContactFormData ( data: ContactFormRequest, schema: Joi.ObjectSchema ): ValidatedFormData {
    // JOI only returns the first error on validation
    const { error, value } = contactFormSchema.validate( data );
    const errors: ResponseMessage[] = [];
    if ( error ) {
        error.details.forEach( detailObj => {
            const responseMessage: ResponseMessage = {
                target: detailObj.context.key,
                text: detailObj.message
            };

            // If the target is captcha, then modify to 'submit' since that's where captcha errors are displayed
            responseMessage.target = 'submit';

            errors.push(responseMessage );
        });
    }

    const validatedData: ValidatedFormData = {
        data: value,
        errors: errors
    };

    return validatedData;
}

export async function renderIndex ( ctx: ExtendedContext ) {
    const feed = await getAggregatedFeed( Config.maxBlogPosts );
    let posts = feed.posts;
    if ( posts.length < 1 ) {
        posts = undefined;
    }
    const github = await getUserReposWithStars( Config.githubUser, true, Config.maxRepos, 'updated' );
    let repositories = github.repositories;
    if ( repositories.length < 1 ) {
        repositories = undefined;
    }

    const year = new Date().getFullYear().toString();

    // Get a captcha object
    const captcha = await getCaptcha( Config.captchaLength, Config.captchaFontSize );

    try {
        await ctx.setCaptcha( ctx.csrf, captcha );
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

    const validatedData = validateContactFormData( ctx.request.body, contactFormSchema );
    if ( validatedData.errors.length > 0 ) {
        // Validation against the schema failed, so respond with 422 status and relevant errors
        ctx.status = 422;
        ctx.body = getResponseObj( false, validatedData.errors );

        try {
            await ctx.deleteCaptcha( csrf );
        } catch ( error ) {
            logger.error( `Failed to delete csrf/captcha key/value: ${error}` );
        }

        return;
    }

    try {
        const captchaString = await ctx.getCaptcha( csrf );

        // Delete the captcha value from the store after getting the string, so it can only be used with this csrf token once
        try {
            await ctx.deleteCaptcha( csrf );
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
                text: ErrorMessages.InvalidCaptcha,
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
        senderName: validatedData.data.name,
        senderAddress: validatedData.data.email,
        text: validatedData.data.message
    };

    try {
        await contactMailer.send( Config.sendEmailAddress, Config.recvEmailAddress, formEmail, true );
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
    const captcha = await getCaptcha( Config.captchaLength, Config.captchaFontSize );

    const csrf = ctx.headers[ 'x-csrf-token' ];
    if ( csrf !== undefined ) {
        // Check if the provided csrf value exists in the store (e.g. it was actually served and is not a random value)
        const existingCaptcha = await ctx.getCaptcha( csrf );
        if ( existingCaptcha !== undefined ) {
            // New captcha requested from existing valid csrf, so store new captcha overwriting any previous
            try {
                await ctx.setCaptcha( csrf, captcha );
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