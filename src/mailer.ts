import * as NodeMailer from 'nodemailer';
import { openpgpEncrypt } from 'nodemailer-openpgp';
import * as Handlebars from 'handlebars';
import { readFile } from 'fs';

import { Config } from './config';
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
    constructor( host: string, port: number, username: string, password: string, templatePath: string, confirmationTemplatePath: string, pgpKeyPath: string ) {
        const credentials = {
            port: port,
            secure: true,
            host: host,
            auth: {
                user: username,
                pass: password
            }
        };
        this._mailer = NodeMailer.createTransport( credentials );

        // Test the mail server configuration, but don't break/throw on failure
        ( async () => {
            await this._mailer.verify().catch( error => {
                logger.error( `Could not authenticate with the mail-server:\n${error}` );

            } );
        } )();

        // Load main email template
        readFile( templatePath, ( error, template ) => {
            if ( error ) {
                logger.error( 'Could not load email template!' );
                throw error;
            }

            this._template = Handlebars.compile( template.toString() );
        } );

        // Load confirmation email template
        readFile( confirmationTemplatePath, ( error, template ) => {
            if ( error ) {
                logger.error( 'Could not load email template!' );
                throw error;
            }

            this._confirmationTemplate = Handlebars.compile( template.toString() );
        } );

        // Load OpenPGP public key if a path was provided
        if ( pgpKeyPath ) {
            readFile( pgpKeyPath, ( error, key ) => {
                if ( error ) {
                    logger.error( `Could not load OpenPGP key from ${pgpKeyPath}.` );
                    throw error;
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

        await this._mailer.sendMail( mail ).catch( error => {
            logger.error( `Could not send confirmation mail:\n${error}` );
        } );
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

        // Send the email to the receiving address
        await this._mailer.sendMail( mail ).catch( error => {
            logger.error( `Could not send mail: ${error}` );
            throw error;
        } );

        // If chosen, send a confirmation back to sender with their provided details
        if ( sendConfirmation ) {
            this.sendConfirmation( sendAddr, toAddr, email ).catch( error => {
                logger.error( `Could not send confirmation mail: ${error}` );
                throw error;
            } );
        }

    }
}

const contactMailer = new Mailer( Config.emailHost, Config.smtpPort, Config.emailUsername, Config.emailPassword, Config.emailTemplatePath, Config.emailConfirmationTemplatePath, Config.pgpKeyPath );

export { contactMailer, Mailer };