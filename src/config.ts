import * as dotenv from 'dotenv';

dotenv.config({ path: '.config.env' });

export interface IConfig {
    port: number;
    debugLogging: boolean;
    sessionKey: string;
    emailHost: string;
    emailPassword: string;
    emailAddress: string;
    mediumUser: string;
    maxBlogPosts: number;
    githubUser: string;
    maxRepos: number;
}

const config: IConfig = {
    port: +process.env.PORT || 3000,
    debugLogging: process.env.NODE_ENV == 'development',
    sessionKey: process.env.SESSION_KEY || 'some_secret_key',
    emailHost: process.env.EMAIL_HOST || 'localhost',
    emailPassword: process.env.EMAIL_PASSWORD || 'secret',
    emailAddress: process.env.EMAIL_ADDRESS || 'foo@bar.com',
    mediumUser: process.env.MEDIUM_USER || '@medium',
    maxBlogPosts: parseInt(process.env.MAX_POSTS) || 20,
    githubUser: process.env.GITHUB_USER || 'Chadsr',
    maxRepos: parseInt(process.env.MAX_REPOS) || 20
};

export { config };