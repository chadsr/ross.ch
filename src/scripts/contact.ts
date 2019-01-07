import axios, { AxiosResponse } from 'axios';

import { Response, Message } from '../interfaces';

// A basic contact form class
export default class ContactForm {
  form: HTMLFormElement;
  formMessages: HTMLElement;
  constructor(formId) {
    this.form = <HTMLFormElement>document.getElementById(formId);
    this.formMessages = document.getElementById(`${formId}-messages`);
  }

  displayMessages(messages: Message[]) {
    const messageList = document.createElement('ul');

    messages.forEach((message) => {
      const li = document.createElement('li');
      li.innerHTML = message.text;
      messageList.appendChild(li);
    });

    // Remove previous messages
    this.formMessages.innerHTML = '';

    this.formMessages.appendChild(messageList);
  }

  handleResponse(response: Response) {
    this.displayMessages(response.messages);

    // If it was a success response, reset the form
    if (response.success) {
      this.reset();
    }
  }

  reset() {
    this.form.reset();
  }

  submit(e) {
    e.preventDefault();

    const name: string = this.form.elements['name'].value;
    const email: string = this.form.elements['email'].value;
    const message: string = this.form.elements['message'].value;
    const csrfToken: string = this.form.elements['_csrf'].value;

    const data = {
      name: name,
      email: email,
      message: message,
    };

    axios({
      method: 'POST',
      url: '/',
      headers: {'X-CSRF-Token': csrfToken},
      xsrfHeaderName: 'X-CSRF-Token',
      xsrfCookieName: 'XSRF-TOKEN',
      data: data
    }).catch(error => {
      this.handleResponse(error.response.data);
    }).then(<Response>(response) => {
      this.handleResponse(response.data);
    });
  }
}
