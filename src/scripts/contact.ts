const axios = require('axios');

// A basic contact form class
export default class ContactForm {
  form;
  constructor(formId) {
    this.form = document.getElementById(formId);
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

    const name = this.form.elements['name'].value;
    const email = this.form.elements['email'].value;
    const message = this.form.elements['message'].value;
    const csrfToken = this.form.elements['_csrf'].value;

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
