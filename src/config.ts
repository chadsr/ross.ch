import * as dotenv from 'dotenv';

dotenv.config({ path: '.config.env' });

export interface IConfig {
    port: number;
    debugLogging: boolean;
    sessionKey: string;
}

const config: IConfig = {
    port: +process.env.PORT || 3000,
    debugLogging: process.env.NODE_ENV == 'development',
    sessionKey: process.env.SESSION_KEY || 'some_secret_key',
};

export { config };