var express = require('express')
var app = express();


var bodyParser = require('body-parser')
var mongoose = require('mongoose');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var flash = require('connect-flash');
var expressValidator = require('express-validator');
const path = require('path')
const passport = require('passport');
const MongoStore = require('connect-mongo')(session);
const compression = require('compression');
const logger = require('morgan');
const expressStatusMonitor = require('express-status-monitor');

// Requires .env File (make sure to set this up)
require('dotenv').config()

app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: 'clean-auth-template-ijsdiofjio3j4iojeisodfjoi3joidjfviosdjf893jsodf',
    store: new MongoStore({
      url: process.env.MONGODB_URI || "mongodb://localhost/csce-315",
      autoReconnect: true,
      clear_interval: 3600
    })
}));
mongoose.connect(process.env.MONGODB_URI || "mongodb://heroku_7p1z5rhc:i1e97cr1qbjfdpug79k1pn6tbj@ds113522.mlab.com:13522/heroku_7p1z5rhc", { useNewUrlParser: true, useUnifiedTopology: true })
// mongoose.connect(process.env.MONGODB_URI  || 'mongodb://localhost/csce-315', { useNewUrlParser: true, useUnifiedTopology: true })

mongoose.Promise = global.Promise;
mongoose.set('useCreateIndex', true);

// Middleware 
app.use(express.static('public'))
app.use(flash());
app.set('view engine', 'ejs');
app.use(expressStatusMonitor());
app.use(compression());
app.use(logger('dev'));
app.use(expressValidator());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());

app.use(function (req, res, next) {
    res.locals.user = req.user || null;
    res.locals.url = req.url.split("/");
    next();
});


app.use('/u', require(path.join(__dirname, 'server', 'auth', 'auth.passport.js')));
app.use('/', require(path.join(__dirname, 'server', 'routing.js')));

// app.get('/', loggedIn, (req, res) => {
//     res.render('home')
// })

// function loggedIn(req, res, next) {
//     if (req.user) {
//         next();
//     } else {
//         req.flash('error_msg', 'An account is required to access this page.');
//         res.redirect('/u/login');
//     }
// }

// Wildcard 404 Routes

app.get('*', (req, res) => {
    res.send('404 error')
})

var PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log('Server listening on port', PORT)
})