import * as NodeMailer from 'nodemailer';
import * as SMTPTransport from 'nodemailer/lib/smtp-transport';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { openpgpEncrypt } from 'nodemailer-openpgp';

import * as Handlebars from 'handlebars';
import { readFile } from 'fs';

import { Config } from './config';

export interface EmailPlaintext {
    senderName: string;
    senderAddress: string;
    text: string;
}

export interface EmailFormatted {
    from: string;
    to: string;
    subject: string;
    html: string;
    encryptionKeys?: string[];
}

class Mailer {
    private _mailer: NodeMailer.Transporter<SMTPTransport.SentMessageInfo>;
    private _template!: HandlebarsTemplateDelegate<unknown>;
    private _confirmationTemplate!: HandlebarsTemplateDelegate<unknown>;
    private _pgpPubKey!: string;
    constructor(
        host: string,
        port: number,
        username: string,
        password: string,
        templatePath: string,
        confirmationTemplatePath: string,
        pgpKeyPath: string,
    ) {
        const credentials = {
            port: port,
            secure: true,
            host: host,
            auth: {
                user: username,
                pass: password,
            },
        };

        this._mailer = NodeMailer.createTransport(credentials);

        // Load main email template
        if (templatePath !== '') {
            readFile(templatePath, (error, template) => {
                if (error) {
                    throw error;
                }

                this._template = Handlebars.compile(template.toString());
            });
        }

        // Load confirmation email template
        if (confirmationTemplatePath !== '') {
            readFile(confirmationTemplatePath, (error, template) => {
                if (error) {
                    throw error;
                }

                this._confirmationTemplate = Handlebars.compile(template.toString());
            });
        }

        // Load OpenPGP public key if a path was provided
        if (pgpKeyPath !== '') {
            readFile(pgpKeyPath, (error, key) => {
                if (error) {
                    throw error;
                }

                this._pgpPubKey = key.toString();
            });

            this._mailer.use('stream', openpgpEncrypt());
        }
    }

    private async sendConfirmation(sendAddr: string, toAddr: string, email: EmailPlaintext) {
        const mail: EmailFormatted = {
            from: sendAddr,
            to: toAddr,
            subject: 'Ross.ch - Message Received!',
            html: this._confirmationTemplate(email),
        };

        await this._mailer.sendMail(mail);
    }

    public async send(
        sendAddr: string,
        toAddr: string,
        email: EmailPlaintext,
        sendConfirmation: boolean,
    ): Promise<void> {
        const mail: EmailFormatted = {
            from: sendAddr,
            to: toAddr,
            subject: `Ross.ch - New message from  ${email.senderName}`,
            html: this._template(email),
        };

        // If we are using a OpenPGP keyfile, then load the public key and add it to the email configuration
        if (this._pgpPubKey !== undefined) {
            mail.encryptionKeys = [this._pgpPubKey];
        }

        // Send the email to the receiving address
        await this._mailer.sendMail(mail);

        // If chosen, send a confirmation back to sender with their provided details
        if (sendConfirmation) {
            await this.sendConfirmation(sendAddr, toAddr, email);
        }
    }
}

const contactMailer = new Mailer(
    Config.emailHost,
    Config.smtpPort,
    Config.emailUsername,
    Config.emailPassword,
    Config.emailTemplatePath,
    Config.emailConfirmationTemplatePath,
    Config.pgpKeyPath,
);

export { contactMailer, Mailer };
