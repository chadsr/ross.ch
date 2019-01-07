import * as dotenv from 'dotenv';
import { ProvidePlugin } from 'webpack';

dotenv.config({ path: '.config.env' });

export interface IConfig {
    port: number;
    debugLogging: boolean;
    sessionKey: string;
    emailHost: string;
    emailPassword: string;
    emailAddress: string;
    mediumUser: string;
}

const config: IConfig = {
    port: +process.env.PORT || 3000,
    debugLogging: process.env.NODE_ENV == 'development',
    sessionKey: process.env.SESSION_KEY || 'some_secret_key',
    emailHost: process.env.EMAIL_HOST || 'localhost',
    emailPassword: process.env.EMAIL_PASSWORD || 'secret',
    emailAddress: process.env.EMAIL_ADDRESS || 'foo@bar.com',
    mediumUser: process.env.MEDIUM_USER || '@medium'
};

export { config };