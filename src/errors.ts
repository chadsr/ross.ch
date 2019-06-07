export interface IErrors {
    invalidEmail: string;
    invalidName: string;
    invalidMsg: string;
}

const errors: IErrors = {
    invalidEmail: 'Email looks invalid :(',
    invalidName: 'Name is a little short...',
    invalidMsg: 'Message is a little short...'
};

export { errors };