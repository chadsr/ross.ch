const createError = require('http-errors');
const express = require('express');
const hbs = require('express-handlebars');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');
const validator = require('express-validator');
const helmet = require('helmet');
const cookieParser = require('cookie-parser')
const csrf = require('csurf');

const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const webpackConfig = require('../webpack.config.js');
const compiler = webpack(webpackConfig);

const isDeveloping = process.env.NODE_ENV !== 'production';

const publicDir = path.join(__dirname, 'public');
const viewsDir = path.join(__dirname, 'views');
const routesDir = path.join(__dirname, 'routes');

const indexRouter = require(path.join(routesDir, 'index'));

const app = express();

// view engine setup
app.engine('hbs', hbs( {
  extname: 'hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(viewsDir, 'layouts'),
  partialsDir: [
    path.join(viewsDir, 'partials'),
    publicDir // For fetching webpack stuff
  ]
}));

app.set('view engine', 'hbs');
app.set('views', viewsDir);

// Load dev middlewares if developing
if (isDeveloping) {
  console.log('Development Mode.');
  app.use(webpackDevMiddleware(compiler, {
    publicPath: webpackConfig.output.publicPath,
    log: console.log
  }));

  app.use(webpackHotMiddleware(compiler, {
    publicPath: webpackConfig.output.publicPath,
    log: console.log,
    hot: true
  }));

  app.use(logger('dev'));
} else {
  console.log('Production Mode.');
}

// Production middleware
const middlewares = [
  express.static(publicDir, {maxAge: 604800000}),
  bodyParser.json(),
  helmet(),
  bodyParser.urlencoded({extended: false}),
  cookieParser(),
  csrf({cookie: true}),
  validator()
];

app.use(middlewares);

// Set a CSRF token
app.use(function(req, res, next) {
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  console.log('404');
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
