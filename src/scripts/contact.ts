import axios, { AxiosResponse } from 'axios';

import { Response, ResponseMessage, ContactFormRequest } from '../interfaces';
import { ErrorMessages } from '../errors';
import { Config } from '../config';

const CAPTCHA_ID = 'captcha-img';

// A basic contact form class
export default class ContactForm {
    private readonly _form: HTMLFormElement;
    private readonly _formLabels: { [ key: string ]: HTMLLabelElement };
    private readonly _formSubmitBtn: HTMLButtonElement;

    constructor( formId ) {
        this._form = <HTMLFormElement> document.getElementById( formId );

        // Make formLabels object where key is the label's 'for' element name and value is the HTMLLabelElement
        this._formLabels = {};
        const labels = this._form.getElementsByTagName( 'label' );
        for ( let i = 0; i < labels.length; i++ ) {
            const key = labels[ i ].htmlFor;
            this._formLabels[ key ] = labels[ i ];
        }

        this._formSubmitBtn = <HTMLButtonElement> document.getElementById( formId + '-submit-btn' );
    }

    displayResponse ( response: Response ) {
        let target: HTMLElement;

        response.messages.forEach( ( message ) => {
            // Check if target has an associated label to use first
            if ( message.target in this._formLabels ) {
                target = this._formLabels[ message.target ];
            } else { // No label, so our target is the actual element
                target = this._form.elements[ message.target ];
            }

            target.innerHTML = message.text;

            // Add a class so we can colourise the target
            if ( response.success ) {
                target.classList.add( 'success' );
            } else {
                target.classList.add( 'error' );
                target.scrollIntoView();
            }
        } );
    }

    handleResponse ( response: Response ) {
        this.displayResponse( response );

        // If it was a success response, reset the form
        if ( response.success ) {
            this.resetInput();
            this.resetLabels();
        }

        // Reset the submit button back to normal after 4s
        setTimeout( () => {
            this.resetSubmitButton();
        }, Config.formMessageDurationMs );
    }

    resetSubmitButton () {
        // Reset the submit button
        this._formSubmitBtn.innerHTML = 'Submit';
        this._formSubmitBtn.className = '';
    }
    refreshCaptcha ( csrfToken: string ) {
        axios( {
            method: 'GET',
            url: '/captcha',
            headers: { 'X-CSRF-Token': csrfToken },
            xsrfHeaderName: 'X-CSRF-Token',
            xsrfCookieName: 'XSRF-TOKEN'
        } ).then( ( response: AxiosResponse ) => {
            const resp: Response = response.data;
            const captchaBas64 = resp.messages[ 0 ].text;
            const captchaImg = document.getElementById( CAPTCHA_ID ) as HTMLImageElement;
            captchaImg.src = captchaBas64;
            this._form.captcha.value = ''; // Remove old input for user convenience
        } ).catch( error => {
            let response;
            if ( error.response ) {
                // We got no response, so construct a response message client-side
                response = <Response> {
                    messages: [ {
                        target: 'submit',
                        text: 'Failed to refresh captcha. Try again?'
                    } ]
                };
            }

            this.handleResponse( response );
        } );
    }
    resetLabels () {
        // Replace all form labels with their original text and remove classes
        Object.keys( this._formLabels ).forEach( ( key ) => {
            const label = this._formLabels[ key ];
            label.innerHTML = key.replace( /^\w/, c => c.toUpperCase() );
            label.classList.remove( 'error' );
        } );
    }

    resetInput () {
        this._form.reset();
    }

    validateEmail ( email: string ): boolean {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test( String( email ).toLowerCase() );
    }

    isFormDataValid ( formData: ContactFormRequest ): boolean {
        let valid = true;

        // Invalid name
        if ( formData.name.length < Config.minNameLength ) {
            const nameLabel = this._formLabels[ 'name' ];
            nameLabel.innerHTML = ErrorMessages.InvalidNameShort;
            nameLabel.classList.add( 'error' );
            nameLabel.scrollIntoView();
            valid = false;
        } else if ( formData.name.length > Config.maxNameLength) {
            const nameLabel = this._formLabels[ 'name' ];
            nameLabel.innerHTML = ErrorMessages.InvalidNameLong;
            nameLabel.classList.add( 'error' );
            nameLabel.scrollIntoView();
            valid = false;
        }

        // Invalid email address
        if ( !this.validateEmail( formData.email ) ) {
            const emailLabel = this._formLabels[ 'email' ];
            emailLabel.innerHTML = ErrorMessages.InvalidEmail;
            emailLabel.classList.add( 'error' );
            emailLabel.scrollIntoView();
            valid = false;
        }

        // Invalid message
        if ( formData.message.length < Config.minMessageLength ) {
            const msgLabel = this._formLabels[ 'message' ];
            msgLabel.innerHTML = ErrorMessages.InvalidMsg;
            msgLabel.classList.add( 'error' );
            msgLabel.scrollIntoView();
            valid = false;
        }

        // Only check captcha server-side, so a new one is always provided on failure

        return valid;
    }

    submit ( e ) {
        e.preventDefault();

        // Remove any existing messages from the form
        this.resetLabels();
        this.resetSubmitButton();

        const csrfToken: string = this._form.elements[ '_csrf' ].value;

        const formData: ContactFormRequest = {
            name: this._form.elements[ 'name' ].value,
            email: this._form.elements[ 'email' ].value,
            message: this._form.elements[ 'message' ].value,
            captcha: this._form.elements[ 'captcha' ].value,
        };

        // Do some client-side validation and continue if it passes
        if ( this.isFormDataValid( formData ) === true ) {
            this._formSubmitBtn.innerHTML = 'Sending...';

            axios( {
                method: 'POST',
                url: '/',
                headers: { 'X-CSRF-Token': csrfToken },
                xsrfHeaderName: 'X-CSRF-Token',
                xsrfCookieName: 'XSRF-TOKEN',
                data: formData,
                timeout: Config.formSubmitTimeoutMs
            } ).then( ( response: AxiosResponse ) => {
                this.handleResponse( response.data );
            } ).catch( error => {
                let response;
                if ( !error.response ) {
                    // We got no response, so construct a response message client-side
                    response = <Response> {
                        messages: [ {
                            target: 'submit',
                            text: 'Server failure. Try later?'
                        } ]
                    };
                } else {
                    response = error.response.data;
                }

                this.handleResponse( response );
            } );

            this.refreshCaptcha( csrfToken );
        }
    }
}
