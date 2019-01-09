export interface Message {
  target: string; // Used to specify an identifier that this message applies to
  text: string;
}

export interface Response {
  success: boolean;
  messages: Message[];
}

export interface MediumPost {
  title: string;
  url: string;
  publishDate: string;
  creator?: string;
  contentSnippet: string;
  tags: string[];
}

export interface MediumFeed {
  posts: MediumPost[];
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