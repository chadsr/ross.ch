import axios from 'axios';

// A basic contact form class
export default class ContactForm {
  form: HTMLFormElement;
  constructor(formId) {
    this.form = <HTMLFormElement>document.getElementById(formId);
  }

  handleResponse(response) {
    switch (response.status)  {
      case 200: // Success
      this.reset();

      break;

      case 422: // Rejected form values
      console.log(response.data);
      break;

      case 503: // Email server unavailable
      console.log(response.data);
      break;
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
      this.handleResponse(error.response);
    }).then((response) => {
      this.handleResponse(response);
    });
  }
}
