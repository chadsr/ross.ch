export interface ErrorMessagesI {
    InvalidEmail: string;
    InvalidNameShort: string;
    InvalidNameLong: string;
    InvalidMsg: string;
    InvalidCaptcha: string;
}

const ErrorMessages: ErrorMessagesI = {
    InvalidEmail: 'Invalid Email',
    InvalidNameShort: 'Got a more unique name?',
    InvalidNameLong: 'Got a nickname?',
    InvalidMsg: 'Got something more to say?',
    InvalidCaptcha: 'Invalid Captcha',
};

export { ErrorMessages };
