import { createTransport } from 'nodemailer';
import * as Mail from 'nodemailer/lib/mailer';
import { compile } from 'handlebars';
import { join } from 'path';
import to from 'await-to-js';
import { readFile } from 'fs';

import { config } from './config';
import { logger } from './logging';

export interface Email {
  senderName: string;
  senderAddress: string;
  senderIP: string;
  text: string;
}

class Mailer {
  private readonly _mailer: Mail;
  private _htmlTemplate;
  constructor(host: string, username: string, password: string, templatePath: string) {
    const credentials = {
      host: host,
      auth: {
        user: username,
        pass: password
      }
    };
    this._mailer = createTransport(credentials);

    readFile(templatePath, (err, template) => {
      if (err) {
        logger.error('Could not load email template!');
        throw err;
      }

      this._htmlTemplate = compile(template.toString());
    });
  }

  public send(sendAddr: string, toAddr: string, email: Email): Promise<{}> {
    const mail: any = {
      from: sendAddr,
      to: toAddr,
      subject: `Ross.ch - New message from  ${email.senderName} (${email.senderAddress})`,
      html: this._htmlTemplate(email)
    };

    return this._mailer.sendMail(mail);
  }

  public verify(): Promise<{}> {
    return this._mailer.verify();
  }
}

const contactMailer = new Mailer(config.emailHost, config.sendEmailAddress, config.sendEmailPassword, join(__dirname, 'views/email.hbs'));
(async () => {
  // Check if the contact form mailer can authenticate successfully
  const [ err ] = await to(contactMailer.verify());
  if (err) logger.error('Could not authenticate with mail server:', err);
})();

export { contactMailer, Mailer };