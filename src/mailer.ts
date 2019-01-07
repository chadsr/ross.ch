import { createTransport } from 'nodemailer';
import * as Mail from 'nodemailer/lib/mailer';
import { compile } from 'handlebars';
import { join } from 'path';
import to from 'await-to-js';

import { config } from './config';
import { logger } from './logging';

class Mailer {
  private readonly _mailer: Mail;
  private readonly _htmlTemplate;
  constructor(host: string, username: string, password: string, templatePath: string) {
    const credentials = {
      host: host,
      auth: {
        user: username,
        pass: password
      }
    };

    this._mailer = createTransport(credentials);
    this._htmlTemplate = compile(templatePath);
  }

  public send(from: string, to: string, subject: string, text: string): Promise<{}> {
    const mail: any = {
      from: from,
      to: to,
      subject: subject,
      html: this._htmlTemplate({text: text})
    };

    return this._mailer.sendMail(mail);
  }

  public verify(): Promise<{}> {
    return this._mailer.verify();
  }
}

const contactMailer = new Mailer(config.emailHost, config.emailAddress, config.emailPassword, join(__dirname, 'views/email.hbs'));
(async () => {
  // Check if the contact form mailer can authenticate successfully
  const [ err ] = await to(contactMailer.verify());
  if (err) logger.error('Could not authenticate with mail server:', err);
})();

export {contactMailer, Mailer};