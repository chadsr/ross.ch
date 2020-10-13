export interface ErrorMessagesI {
    InvalidEmail: string;
    InvalidNameShort: string;
    InvalidNameLong: string;
    InvalidMsg: string;
    InvalidCaptcha: string;
}

const ErrorMessages: ErrorMessagesI = {
    InvalidEmail: 'Email looks invalid :(',
    InvalidNameShort: 'Is your name really one character?',
    InvalidNameLong: 'Do you have a shorter name I can call you?',
    InvalidMsg: 'Message is a little short...',
    InvalidCaptcha: 'Captcha is invalid!',
};

export { ErrorMessages };
