import * as dotenv from 'dotenv';
import * as random from 'randomatic';
import { resolve } from 'path';

import { Colour } from './interfaces';

const configEnvPath = resolve(__dirname, '../.config.env');
dotenv.config({ path: configEnvPath });

export interface IConfig {
    port: number;
    title: string;
    description: string;
    debugLogging: boolean;
    sessionKey: string;
    emailHost: string;
    smtpPort: number;
    emailUsername: string;
    emailPassword: string;
    sendEmailAddress: string;
    recvEmailAddress: string;
    mediumUser: string;
    ghostUrl: string;
    ghostPublicApiKey: string;
    maxBlogPosts: number;
    githubUser: string;
    githubToken: string;
    maxRepos: number;
    emailTemplatePath: string;
    emailConfirmationTemplatePath: string;
    pgpKeyPath: string;
    csrfExpiryMs: number;
    captchaLength: number;
    captchaFontSize: number;
    captchaBackgroundColour: Colour;
    captchaMinContrastRatio: number; // The minimum contrast ratio between captcha text colour and the background colour (for improved readability)
    minNameLength: number;
    maxNameLength: number;
    minEmailDomainSegments: number;

    minMessageLength: number;
    formSubmitTimeoutMs: number;
    formMessageDurationMs: number;
}

const Config: IConfig = {
    port: +process.env.PORT || 8080,
    debugLogging: process.env.NODE_ENV == 'development',
    title: process.env.TITLE || 'Ross Chadwick',
    description:
        process.env.DESCRIPTION ||
        'Ross Chadwick - Hacker, explorer, maker of strange things that are sometimes useful.',
    sessionKey: process.env.SESSION_KEY || random('*', 32),
    emailHost: process.env.EMAIL_HOST || 'localhost',
    smtpPort: parseInt(process.env.SMTP_PORT) || 465,
    emailUsername: process.env.EMAIL_USERNAME || 'foo@bar.com',
    emailPassword: process.env.EMAIL_PASSWORD || 'secret',
    sendEmailAddress: process.env.SENDER_EMAIL_ADDRESS || 'foo@bar.com',
    recvEmailAddress: process.env.RECV_EMAIL_ADDRESS || 'foo@bar.com',
    ghostUrl: process.env.GHOST_URL || 'https://blog.ross.ch',
    ghostPublicApiKey: process.env.GHOST_PUB_KEY || '8c55bff1844399dad7ce341607',
    mediumUser: process.env.MEDIUM_USER || '@medium',
    maxBlogPosts: parseInt(process.env.MAX_POSTS) || 20,
    githubUser: process.env.GITHUB_USER || 'Chadsr',
    githubToken: process.env.GITHUB_TOKEN || 'some_secret_token',
    maxRepos: parseInt(process.env.MAX_REPOS) || 20,
    emailTemplatePath: resolve(__dirname, 'views/email.hbs'),
    emailConfirmationTemplatePath: resolve(__dirname, 'views/email_confirmation.hbs'),
    pgpKeyPath: process.env.PGP_KEY_PATH || resolve(__dirname, 'assets/files/2B7340DB13C85766.asc'),
    captchaLength: parseInt(process.env.CAPTCHA_LEN) || 4,
    captchaFontSize: 20,
    captchaBackgroundColour: { red: 31, green: 31, blue: 31 },
    captchaMinContrastRatio: 3,
    csrfExpiryMs: parseInt(process.env.CSRF_EXPIRY) || 1800000,
    minNameLength: 2,
    maxNameLength: 32,
    minEmailDomainSegments: 2,
    minMessageLength: 2,
    formSubmitTimeoutMs: 5000,
    formMessageDurationMs: 2000,
};

export { Config };
