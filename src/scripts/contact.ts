import axios, { AxiosResponse } from 'axios';

import { Response, Message } from '../interfaces';

// A basic contact form class
export default class ContactForm {
  private readonly _form: HTMLFormElement;
  private readonly _formLabels: {[key: string]: HTMLLabelElement};
  private readonly _formSubmitBtn: HTMLButtonElement;
  private readonly _formPage: HTMLDivElement;

  constructor(formId) {
    this._form = <HTMLFormElement>document.getElementById(formId);

    // Make formLabels object where key is the label's 'for' element name and value is the HTMLLabelElement
    this._formLabels = {};
    const labels = this._form.getElementsByTagName('label');
    for (let i = 0; i < labels.length; i++) {
      const key = labels[i].htmlFor;
      this._formLabels[key] = labels[i];
    }

    this._formSubmitBtn = <HTMLButtonElement>document.getElementById(formId + '-submit-btn');
  }

  displayResponse(response: Response) {
    let target: HTMLElement;

    response.messages.forEach((message) => {
      // Check if target has an associated label to use first
      if (message.target in this._formLabels) {
        target = this._formLabels[message.target];
      } else { // No label, so our target is the actual element
        target = this._form.elements[message.target];
      }

      target.innerHTML = message.text;

      // Add a class so we can colourise the target
      if (response.success) {
        target.classList.add('success');
      } else {
        target.classList.add('error');
        target.scrollIntoView();
      }
    });
  }

  handleResponse(response: Response) {
    this.displayResponse(response);

    // If it was a success response, reset the form
    if (response.success) {
      this.resetInput();
      this.resetLabels();
    }

    // Reset the submit button back to normal after 4s
    setTimeout(() => {
      this.resetSubmitButton();
    }, 4000);
  }

  resetSubmitButton() {
    // Reset the submit button
    this._formSubmitBtn.innerHTML = 'Submit';
    this._formSubmitBtn.className = '';
  }

  resetLabels() {
    // Replace all form labels with their original text and remove classes
    Object.keys(this._formLabels).forEach((key) => {
      const label = this._formLabels[key];
      label.innerHTML = key.replace(/^\w/, c => c.toUpperCase());
      label.classList.remove('error');
    });
  }

  resetInput() {
    this._form.reset();
  }

  submit(e) {
    e.preventDefault();

    // Remove any existing messages from the form
    this.resetLabels();
    this.resetSubmitButton();

    const name: string = this._form.elements['name'].value;
    const email: string = this._form.elements['email'].value;
    const message: string = this._form.elements['message'].value;
    const csrfToken: string = this._form.elements['_csrf'].value;

    const data = {
      name: name,
      email: email,
      message: message,
    };

    this._formSubmitBtn.innerHTML = 'Sending...';

    axios({
      method: 'POST',
      url: '/',
      headers: {'X-CSRF-Token': csrfToken},
      xsrfHeaderName: 'X-CSRF-Token',
      xsrfCookieName: 'XSRF-TOKEN',
      data: data
    }).catch(error => {
      let response;
      if (!error.response) {
        // We got no response, so construct a response message client-side
        response = <Response>{
          messages: [{
            target: 'submit',
            text: 'Server failure. Try later?'}]
        };
      } else {
        response = error.response.data;
      }

      this.handleResponse(response);
    }).then(<AxiosResponse>(response) => {
      this.handleResponse(response.data);
    });
  }
}
