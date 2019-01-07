export interface Message {
  target?: string; // Used to specify an identifier that this message applies to
  text: string;
}

export interface Response {
  success: boolean;
  messages: Message[];
}