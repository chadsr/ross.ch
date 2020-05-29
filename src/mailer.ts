import * as NodeMailer from 'nodemailer';
import { openpgpEncrypt } from 'nodemailer-openpgp';
import * as Handlebars from 'handlebars';
import { readFile } from 'fs';

import { config } from './config';
import { logger } from './logging';

export interface Email {
    senderName: string;
    senderAddress: string;
    text: string;
}

class Mailer {
    private readonly _mailer: NodeMailer.Transporter;
    private _template;
    private _confirmationTemplate;
    private _pgpPubKey: string;
    constructor( host: string, username: string, password: string, templatePath: string, confirmationTemplatePath: string, pgpKeyPath: string ) {
        const credentials = {
            host: host,
            auth: {
                user: username,
                pass: password
            }
        };
        this._mailer = NodeMailer.createTransport( credentials );

        // Test the mail server configuration, but don't break/throw on failure
        ( async () => {
            try {
                await this._mailer.verify();
            } catch ( err ) {
                logger.error( `Could not authenticate with the mailserver:\n${err}` );
            }
        } )();

        // Load main email template
        readFile( templatePath, ( err, template ) => {
            if ( err ) {
                logger.error( 'Could not load email template!' );
                throw err;
            }

            this._template = Handlebars.compile( template.toString() );
        } );

        // Load confirmation email template
        readFile( confirmationTemplatePath, ( err, template ) => {
            if ( err ) {
                logger.error( 'Could not load email template!' );
                throw err;
            }

            this._confirmationTemplate = Handlebars.compile( template.toString() );
        } );

        // Load OpenPGP public key if a path was provided
        if ( pgpKeyPath ) {
            readFile( pgpKeyPath, ( err, key ) => {
                if ( err ) {
                    logger.error( `Could not load OpenPGP key from ${pgpKeyPath}.` );
                    throw err;
                }

                this._pgpPubKey = key.toString();
            } );

            this._mailer.use( 'stream', openpgpEncrypt() );
        }
    }

    private async sendConfirmation ( sendAddr: string, toAddr: string, email: Email ) {
        const mail: any = {
            from: sendAddr,
            to: email.senderAddress,
            subject: 'Ross.ch - Message Received!',
            html: this._confirmationTemplate( email )
        };

        try {
            await this._mailer.sendMail( mail );
        } catch ( err ) {
            logger.error( `Could not send confirmation mail:\n${err}` );
        }
    }

    public async send ( sendAddr: string, toAddr: string, email: Email, sendConfirmation: Boolean ) {
        const mail: any = {
            from: sendAddr,
            to: toAddr,
            subject: `Ross.ch - New message from  ${email.senderName}`,
            html: this._template( email ),
        };

        // If we are using a OpenPGP keyfile, then load the public key and add it to the email configuration
        if ( this._pgpPubKey ) {
            mail.encryptionKeys = [ this._pgpPubKey ];
        }

        try {
            // Send the email to the receiving address
            await this._mailer.sendMail( mail );

            // If chosen, send a confirmation back to sender with their provided details
            if ( sendConfirmation ) {
                await this.sendConfirmation( sendAddr, toAddr, email );
            }
        } catch ( err ) {
            logger.error( `Could not send mail: ${err}` );
        }
    }
}

const contactMailer = new Mailer( config.emailHost, config.sendEmailAddress, config.sendEmailPassword, config.emailTemplatePath, config.emailConfirmationTemplatePath, config.pgpKeyPath );

export { contactMailer, Mailer };