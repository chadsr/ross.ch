import { Repository } from './../interfaces';
import * as Joi from 'joi';

import { Config } from '../config';
import { Response, ResponseMessage, ContactFormRequest, ValidatedFormData, Captcha } from '../interfaces';
import { contactMailer, EmailPlaintext } from '../mailer';
import { getAggregatedFeed } from '../blog';
import { getUserReposWithStars } from '../github';
import { ErrorMessages } from '../errors';
import { generateCaptcha } from '../captcha';
import { IncomingHttpHeaders } from 'http';
import { FastifyReply, FastifyRequest } from 'fastify';

const contactFormSchema = Joi.object()
    .options({ abortEarly: false })
    .keys({
        name: Joi.string().min(Config.minNameLength).max(Config.maxNameLength).required().messages({
            'string.min': ErrorMessages.InvalidNameShort,
            'string.max': ErrorMessages.InvalidNameLong,
        }),
        email: Joi.string().email({ minDomainSegments: Config.minEmailDomainSegments }).required().messages({
            'string.email': ErrorMessages.InvalidEmail,
        }),
        message: Joi.string().min(Config.minMessageLength).required().messages({
            'string.min': ErrorMessages.InvalidMsg,
        }),
        captcha: Joi.string().length(Config.captchaLength).required().messages({
            'string.min': ErrorMessages.InvalidCaptcha,
            'string.max': ErrorMessages.InvalidCaptcha,
        }),
    });

export function getResponseObj(success: boolean, msg: ResponseMessage | ResponseMessage[]): Response {
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
function validateContactFormData(data: ContactFormRequest): ValidatedFormData {
    // JOI only returns the first error on validation
    const { error, value } = contactFormSchema.validate(data);
    const errors: ResponseMessage[] = [];
    if (error) {
        error.details.forEach((detailObj) => {
            let key = '';
            if (detailObj.context !== undefined && detailObj.context.key !== undefined) {
                key = detailObj.context.key;
            }

            const responseMessage: ResponseMessage = {
                target: key,
                text: detailObj.message,
            };

            // If the target is captcha, then modify to 'submit' since that's where captcha errors are displayed
            responseMessage.target = 'submit';

            errors.push(responseMessage);
        });
    }

    return {
        data: value,
        errors: errors,
    };
}

export const getIndex = async (request: FastifyRequest, reply: FastifyReply) => {
    const feed = await getAggregatedFeed(Config.maxBlogPosts);

    let repositories: Repository[] = [];
    try {
        const github = await getUserReposWithStars(Config.githubUser, true, Config.maxRepos, 'updated');
        repositories = github.repositories;
    } catch (e) {
        request.log.error(e);
    }

    const year = new Date().getFullYear().toString();

    // Get a captcha object
    const captcha = await generateCaptcha(
        Config.captchaLength,
        Config.captchaFontSize,
        Config.captchaBackgroundColour,
        Config.captchaMinContrastRatio,
    );

    try {
        request.session.captcha = captcha;
    } catch (error) {
        request.log.error(`Failed to store captcha: ${error}`);
    }

    await reply.view('index', {
        year: year,
        csrfToken: await reply.generateCsrf(),
        blogPosts: feed.posts,
        githubRepos: repositories,
        captchaBase64: captcha.base64,
    });
};

function getCsrfToken(headers: IncomingHttpHeaders): string {
    const headerCsrf = headers['x-csrf-token'];

    if (Array.isArray(headerCsrf)) {
        return headerCsrf[0];
    } else if (headerCsrf !== undefined) {
        return headerCsrf;
    }
    return '';
}

export const postContact = async (request: FastifyRequest, reply: FastifyReply) => {
    const req = <ContactFormRequest>request.body; // TODO: fix this properly
    const reqCaptcha: string = req.captcha.toUpperCase();

    const csrf = getCsrfToken(request.headers);
    if (csrf === '') {
        reply.code(403);
        return;
    }

    const validatedData = validateContactFormData(<ContactFormRequest>request.body);
    if (validatedData.errors.length > 0) {
        // Validation against the schema failed, so respond with 422 status and relevant errors
        request.session.captcha = undefined;

        reply.code(422);
        reply.send(getResponseObj(false, validatedData.errors));
        return;
    }

    const captcha = <Captcha>request.session.captcha;
    if (reqCaptcha !== captcha.string) {
        request.log.warn(`Captcha didn't match. Got ${reqCaptcha}, expected ${captcha.string}`);

        // Captcha didn't match, so return 401
        reply.code(401);
        reply.send(
            getResponseObj(false, {
                target: 'submit',
                text: ErrorMessages.InvalidCaptcha,
            }),
        );
        return;
    }

    // Delete the captcha value from the session after getting the string, so it can only be used with this csrf token once
    request.session.captcha = undefined;

    // Construct email object from the request body
    const formEmail = <EmailPlaintext>{
        senderName: validatedData.data.name,
        senderAddress: validatedData.data.email,
        text: validatedData.data.message,
    };

    try {
        await contactMailer.send(Config.sendEmailAddress, Config.recvEmailAddress, formEmail, true);
        reply.send(
            getResponseObj(true, {
                text: 'Success!',
                target: 'submit',
            }),
        );
    } catch (error) {
        // Return a 503 error if we couldn't deliver the email for some reason
        request.log.error('Could not send contact form email:', error);
        reply.code(503);
        reply.send(
            getResponseObj(false, {
                text: 'Server failure. Try later?',
                target: 'submit',
            }),
        );
    }
};
