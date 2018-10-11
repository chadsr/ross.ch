const nodemailer = require('nodemailer');
const config = require('../../config');
const { check, validationResult } = require('express-validator/check');
const reqfilter = require('express-validator/filter');

var express = require('express');
var router = express.Router();

const transport = {
  host: config.HOST,
  auth: {
    user: config.EMAIL,
    pass: config.PASS
  }
}

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', {
    title: 'Ross Chadwick',
    csrfToken: res.locals.csrfToken
  });
});

// Verify the transporter is working
const transporter = nodemailer.createTransport(transport)

transporter.verify((error, success) => {
  if (error) {
    console.log(error);
  } else {
    console.log('Server is ready to take emails');
  }
});

// Contact form POST
router.post('/', [
  check('name').isLength({ min: 2}).withMessage('Giving a more meaningful name would be great!').trim().escape(),
  check('message').isLength({ min: 5 }).withMessage('Do you have anything more meaningful to say?').trim().escape(),
  check('email').isEmail().withMessage('That email doesn‘t look right...').normalizeEmail()
], (req, res) => {
  const errors = validationResult(req);

  var remoteIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  if(!errors.isEmpty()) {
    console.log('Invalid contact form request!', remoteIp, req.body);
    return res.status(422).json({
      errors: errors.array()
    });
  }

  var mail = {
    from: req.body.name,
    to: config.EMAIL,
    subject: config.SUBJECT + '(' + remoteIp + ')',
    text: req.body.message
  }

  console.log('Mail:', mail);

  transporter.sendMail(mail, (err, data) => {
    if (err) {
      return res.status(503).json({
        success: 'false'
      });
    } else {
      return res.status(200).json({
        success: 'true'
      });
    }
  })
})

module.exports = router;
