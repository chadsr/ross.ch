import axios, { AxiosResponse } from 'axios';

import { ResponseData, ContactFormRequest } from '../interfaces';
import { ErrorMessages } from '../errors';
import { Config } from '../config';

const CAPTCHA_ID = 'captcha-img';

// Exclude resetting labels for the following field IDs
const EXCLUDE_LABELS_FOR = ['captcha']

// A basic contact form class
export default class ContactForm {
    private readonly _form: HTMLFormElement;
    private readonly _formLabels: { [key: string]: HTMLLabelElement };
    private readonly _formSubmitBtn: HTMLButtonElement;

    constructor(formId: string) {
        this._form = <HTMLFormElement>document.getElementById(formId);

        // Make formLabels object where key is the label's 'for' element name and value is the HTMLLabelElement
        this._formLabels = {};
        const labels = this._form.getElementsByTagName('label');
        for ( let i = 0; i < labels.length; i++ ) {
            const key = labels[ i ].htmlFor;
            if (!EXCLUDE_LABELS_FOR.includes( key ) ) {
                this._formLabels[key] = labels[i];
            }
        }

        this._formSubmitBtn = <HTMLButtonElement>document.getElementById(formId + '-submit-btn');
    }

    displayResponse(responseData: ResponseData): void {
        let target: HTMLElement;
        responseData.messages.forEach( ( message ) => {
            // Check if target has an associated label to use first
            if ( message.target in this._formLabels ) {
                target = this._formLabels[ message.target ];
            } else {
                // No label, so our target is the actual element
                target = this._form.elements[ message.target ];
            }

            target.innerHTML = message.text;

            // Add a class so we can colourise the target
            if ( responseData.success ) {
                target.classList.add( 'success' );
            } else {
                target.classList.add( 'error' );
                target.scrollIntoView();
            }
        } );
    }

    handleResponseData ( responseData: ResponseData ): void {
        this.displayResponse(responseData);

        // If it was a success response, reset the form
        if (responseData.success) {
            this.resetInput();
            this.resetLabels();
        }

        // Reset the submit button back to normal after 4s
        setTimeout(() => {
            this.resetSubmitButton();
        }, Config.formMessageDurationMs);
    }

    resetSubmitButton(): void {
        // Reset the submit button
        this._formSubmitBtn.innerHTML = 'Submit';
        this._formSubmitBtn.className = '';
    }
    refreshCaptcha(csrfToken: string): void {
        axios({
            method: 'GET',
            url: '/captcha',
            headers: { 'X-CSRF-Token': csrfToken },
            xsrfHeaderName: 'X-CSRF-Token',
            xsrfCookieName: 'XSRF-TOKEN',
        })
            .then((response: AxiosResponse) => {
                const data: ResponseData = response.data;
                const captchaBas64 = data.messages[0].text;
                const captchaImg = document.getElementById(CAPTCHA_ID) as HTMLImageElement;
                captchaImg.src = captchaBas64;
                this._form.captcha.value = ''; // Remove old input for user convenience
            })
            .catch((error) => {
                let data: ResponseData;
                if (error.response === undefined) {
                    // We got no response, so construct a response message client-side
                    data = <ResponseData>{
                        messages: [
                            {
                                target: 'submit',
                                text: 'Failed to refresh captcha. Try again?',
                            },
                        ],
                    };
                } else {
                    data = error.response.data;
                }

                this.handleResponseData(data);
            });
    }
    resetLabels(): void {
        // Replace all form labels with their original text and remove classes
        Object.keys(this._formLabels).forEach((key) => {
            const label = this._formLabels[key];
            label.innerHTML = key.replace(/^\w/, (c) => c.toUpperCase());
            label.classList.remove('error');
        });
    }

    resetInput(): void {
        this._form.reset();
    }

    validateEmail(email: string): boolean {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }

    isFormDataValid(formData: ContactFormRequest): boolean {
        let valid = true;

        // Invalid name
        if (formData.name.length < Config.minNameLength) {
            const nameLabel = this._formLabels['name'];
            nameLabel.innerHTML = ErrorMessages.InvalidNameShort;
            nameLabel.classList.add('error');
            nameLabel.scrollIntoView();
            valid = false;
        } else if (formData.name.length > Config.maxNameLength) {
            const nameLabel = this._formLabels['name'];
            nameLabel.innerHTML = ErrorMessages.InvalidNameLong;
            nameLabel.classList.add('error');
            nameLabel.scrollIntoView();
            valid = false;
        }

        // Invalid email address
        if (!this.validateEmail(formData.email)) {
            const emailLabel = this._formLabels['email'];
            emailLabel.innerHTML = ErrorMessages.InvalidEmail;
            emailLabel.classList.add('error');
            emailLabel.scrollIntoView();
            valid = false;
        }

        // Invalid message
        if (formData.message.length < Config.minMessageLength) {
            const msgLabel = this._formLabels['message'];
            msgLabel.innerHTML = ErrorMessages.InvalidMsg;
            msgLabel.classList.add('error');
            msgLabel.scrollIntoView();
            valid = false;
        }

        // Only check captcha server-side, so a new one is always provided on failure

        return valid;
    }

    submit(e: Event): void {
        e.preventDefault();

        // Remove any existing messages from the form
        this.resetLabels();
        this.resetSubmitButton();

        const csrfToken: string = this._form.elements['_csrf'].value;

        const formData: ContactFormRequest = {
            name: this._form.elements['name'].value,
            email: this._form.elements['email'].value,
            message: this._form.elements['message'].value,
            captcha: this._form.elements['captcha'].value,
        };

        // Do some client-side validation and continue if it passes
        if (this.isFormDataValid(formData) === true) {
            this._formSubmitBtn.innerHTML = 'Sending...';

            axios({
                method: 'POST',
                url: '/',
                headers: { 'X-CSRF-Token': csrfToken },
                xsrfHeaderName: 'X-CSRF-Token',
                xsrfCookieName: 'XSRF-TOKEN',
                data: formData,
                timeout: Config.formSubmitTimeoutMs,
            })
                .then((response: AxiosResponse) => {
                    this.handleResponseData(response.data);
                })
                .catch((error) => {
                    let data: ResponseData;
                    if (error.response === undefined) {
                        // We got no response, so construct a response message client-side
                        data = <ResponseData>{
                            messages: [
                                {
                                    target: 'submit',
                                    text: 'Server failure. Try later?',
                                },
                            ],
                        };
                    } else {
                        data = error.response.data;
                    }

                    this.handleResponseData(data);
                });

            this.refreshCaptcha(csrfToken);
        }
    }
}
