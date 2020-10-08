import * as dotenv from 'dotenv';
import * as random from 'randomatic';
import { join } from 'path';

dotenv.config( { path: '.config.env' } );

export interface IConfig {
    port: number;
    title: string;
    description: string;
    debugLogging: boolean;
    sessionKey: string;
    emailHost: string;
    emailUsername: string;
    emailPassword: string;
    sendEmailAddress: string;
    recvEmailAddress: string;
    mediumUser: string;
    ghostUrl: string;
    ghostPublicApiKey: string;
    maxBlogPosts: number;
    githubUser: string;
    maxRepos: number;
    emailTemplatePath: string;
    emailConfirmationTemplatePath: string;
    pgpKeyPath: string;
    csrfExpiryMilis: number;
    captchaLength: number;
    captchaFontSize: number;
}

const config: IConfig = {
    port: +process.env.PORT || 8080,
    debugLogging: process.env.NODE_ENV == 'development',
    title: process.env.TITLE || 'Ross Chadwick',
    description: process.env.DESCRIPTION || 'Ross Chadwick - Hacker, explorer, maker of strange things that are sometimes useful.',
    sessionKey: process.env.SESSION_KEY || random( '*', 32 ),
    emailHost: process.env.EMAIL_HOST || 'localhost',
    emailUsername: process.env.EMAIL_USERNAME || 'foo@bar.com',
    emailPassword: process.env.EMAIL_PASSWORD || 'secret',
    sendEmailAddress: process.env.SENDER_EMAIL_ADDRESS || 'foo@bar.com',
    recvEmailAddress: process.env.RECV_EMAIL_ADDRESS || 'foo@bar.com',
    ghostUrl: process.env.GHOST_URL || 'https://blog.ross.ch',
    ghostPublicApiKey: process.env.GHOST_PUB_KEY || '8c55bff1844399dad7ce341607',
    mediumUser: process.env.MEDIUM_USER || '@medium',
    maxBlogPosts: parseInt( process.env.MAX_POSTS ) || 20,
    githubUser: process.env.GITHUB_USER || 'Chadsr',
    maxRepos: parseInt( process.env.MAX_REPOS ) || 20,
    emailTemplatePath: join( __dirname, 'views/email.hbs' ),
    emailConfirmationTemplatePath: join( __dirname, 'views/email_confirmation.hbs' ),
    pgpKeyPath: process.env.PGP_KEY_PATH || join( __dirname, 'assets/files/2B7340DB13C85766.asc' ),
    captchaLength: parseInt( process.env.CAPTCHA_LEN ) || 4,
    captchaFontSize: 18,
    csrfExpiryMilis: parseInt( process.env.CSRF_EXPIRY ) || 1800000,
};

export { config };