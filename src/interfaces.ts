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

export interface GithubUser {
    id: string;
}

export interface GithubLanguage {
    name: string;
}
export interface GithubRepository {
    id: string;
    url: string;
    name: string;
    description: string;
    updatedAt: string;
    updatedAtFormatted: string;
    isFork: string;
    stargazersCount: number;
    languages: GithubLanguage[];
    parent?: GithubRepository;

    collaborators?: {
        nodes: GithubUser[];
    };
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
