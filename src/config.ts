import * as dotenv from 'dotenv';
import * as random from 'randomatic';

dotenv.config({ path: '.config.env' });

export interface IConfig {
    port: number;
    title: string;
    debugLogging: boolean;
    sessionKey: string;
    emailHost: string;
    emailPassword: string;
    emailAddress: string;
    mediumUser: string;
    ghostUrl: string;
    ghostPublicApiKey: string;
    maxBlogPosts: number;
    githubUser: string;
    maxRepos: number;
}

const config: IConfig = {
    port: +process.env.PORT || 8080,
    debugLogging: process.env.NODE_ENV == 'development',
    title: process.env.TITLE || 'Ross Chadwick',
    sessionKey: process.env.SESSION_KEY || random('*', 32),
    emailHost: process.env.EMAIL_HOST || 'localhost',
    emailPassword: process.env.EMAIL_PASSWORD || 'secret',
    emailAddress: process.env.EMAIL_ADDRESS || 'foo@bar.com',
    ghostUrl: process.env.GHOST_URL || 'https://blog.ross.ch',
    ghostPublicApiKey: process.env.GHOST_PUB_KEY || '8c55bff1844399dad7ce341607',
    mediumUser: process.env.MEDIUM_USER || '@medium',
    maxBlogPosts: parseInt(process.env.MAX_POSTS) || 20,
    githubUser: process.env.GITHUB_USER || 'Chadsr',
    maxRepos: parseInt(process.env.MAX_REPOS) || 20
};

export { config };