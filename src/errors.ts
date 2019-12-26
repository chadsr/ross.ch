export interface IErrors {
    InvalidEmail: Error;
    InvalidName: Error;
    InvalidMsg: Error;
    InvalidCaptcha: Error;
}

const errors: IErrors = {
    InvalidEmail: Error( 'Email looks invalid :(' ),
    InvalidName: Error( 'Name is a little short...' ),
    InvalidMsg: Error( 'Message is a little short...' ),
    InvalidCaptcha: Error( 'Captcha is invalid!' ),
};

export { errors };