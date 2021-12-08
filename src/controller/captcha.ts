import { FastifyRequest, FastifyReply } from 'fastify';
import { getResponseObj } from '.';
import { generateCaptcha } from '../captcha';
import { Config } from '../config';

export const getCaptcha = async (request: FastifyRequest, reply: FastifyReply) => {
    const captcha = await generateCaptcha(
        Config.captchaLength,
        Config.captchaFontSize,
        Config.captchaBackgroundColour,
        Config.captchaMinContrastRatio,
    );

    // New captcha requested, so store new captcha overwriting any previous
    request.session.captcha = captcha;

    reply.send(
        getResponseObj(true, {
            text: captcha.base64,
        }),
    );
};
