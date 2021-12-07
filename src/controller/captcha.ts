import { generateCaptcha } from '../captcha';
import { Config } from '../config';

export async function serveCaptcha(ctx: ParameterizedContext): Promise<void> {
    const captcha = await generateCaptcha(
        Config.captchaLength,
        Config.captchaFontSize,
        Config.captchaBackgroundColour,
        Config.captchaMinContrastRatio,
    );

    const csrf = getCsrfToken(ctx.request.headers);
    if (csrf === '') {
        ctx.status = 403;
        return;
    }

    // Check if the provided csrf value exists in the store (e.g. it was actually served and is not a random value)
    const existingCaptcha = await captchaStore.getCaptcha(csrf);
    if (existingCaptcha !== undefined) {
        // New captcha requested from existing valid csrf, so store new captcha overwriting any previous
        try {
            await captchaStore.setCaptcha(csrf, captcha);
        } catch (error) {
            logger.error(`Failed to store captcha: ${error} `);
        }

        ctx.status = 200;
        ctx.body = getResponseObj(true, {
            text: captcha.base64,
        });

        return;
    }

    // The csrf was not recognised / was not provided
    ctx.status = 401;
}
