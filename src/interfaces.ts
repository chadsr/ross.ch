export interface ResponseMessage {
    target?: string; // Used to specify an identifier that this message applies to
    text: string;
}

export interface Response {
    success: boolean;
    messages: ResponseMessage[];
}

export interface BlogPost {
    title: string;
    url: string;
    publishDate: string;
    publishTimestamp: number; // Publish date in milis (UNIX timestamp)
    creator?: string;
    contentSnippet: string;
    tags: string[];
}

export interface BlogFeed {
    posts: BlogPost[];
}

export interface Repository {
    title: string;
    url: string;
    description: string;
    numberStars: number;
    mainLanguage: string;
    lastUpdated: string;
}

export interface Github {
    repositories: Repository[];
}

export interface ValidatedFormData {
    data: ContactFormRequest;
    errors: ResponseMessage[];
}

export interface ContactFormRequest {
    name: string;
    email: string;
    message: string;
    captcha: string;
}

export interface Captcha {
    base64: string;
    string: string;
}

export interface Colour {
    red: number;
    green: number;
    blue: number;
}
