const nodemailer = require('nodemailer');
const config = require('../../config');
const { check, validationResult } = require('express-validator/check');
const reqfilter = require('express-validator/filter');
const express = require('express');
const router = express.Router();

const transport = {
  host: config.HOST,
  auth: {
    user: config.EMAIL,
    pass: config.PASS
  }
};
const transporter = nodemailer.createTransport(transport);

const getResponseMessage = (msg, err) => {
  if (!Array.isArray(err)) { // If we were passed a single error object, put it in an array for standardising
    err = [err];
  }

  return {
    msg: msg,
    errors: err
  }
};

// Verify the transporter is working
transporter.verify((error, success) => {
  if (error) {
    console.log("\nCould not authenticate with email server:\n", error);
  } else {
    console.log('\nServer is ready to take emails!');
  }
});

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', {
    title: 'Ross Chadwick',
    csrfToken: req.csrfToken() // Add a CSRF token for the contact form request
  });
});

// Contact form POST
router.post('/', [
  check('name').isLength({ min: 2}).withMessage('Giving a more meaningful name would be great!').trim().escape(),
  check('message').isLength({ min: 5 }).withMessage('Do you have anything more meaningful to say?').trim().escape(),
  check('email').isEmail().withMessage('That email doesn‘t look right...').normalizeEmail()
], (req, res, next) => {
  const errors = validationResult(req);

  var remoteIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  // Return a 422 if the request failed validation
  if(!errors.isEmpty()) {
    console.log('Invalid contact form request!', remoteIp, req.body);
    return res.status(422).json(getResponseMessage(null, errors.array()));
  }

  // Format the email to send
  var mail = {
    from: req.body.name,
    to: config.EMAIL,
    subject: config.SUBJECT + '(' + remoteIp + ')',
    text: req.body.message
  }

  console.log('\nMail:', mail);

  transporter.sendMail(mail, (err, data) => {
    if (err) {
      return res.status(503).json(getResponseMessage(null, 'Email server unavailable. Try again later.'));
    } else {
      return res.status(200).json(getResponseMessage('Email sent successfully!', null));
    }
  })
})

module.exports = router;
