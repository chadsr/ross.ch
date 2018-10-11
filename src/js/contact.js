const axios = require('axios');

// A basic contact form class
export default class ContactForm {
  constructor(formId) {
    this.form = document.getElementById(formId);
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

    let data = {
      name: name,
      email: email,
      message: message,
    };

    console.log(data, csrfToken);

    axios({
      method: 'POST',
      url: '/',
      headers: {'X-CSRF-TOKEN': csrfToken},
      data: data
    }).then((response) => {
      console.log('Response:', response);
      if (response.status === 200){
        console.log('sent'); // TODO investigate why these dont trigger
        this.reset();
      } else {
        console.log('fail');
      }
    })
  }
}
