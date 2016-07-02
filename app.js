var express = require('express');
var path = require('path');
var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

// Init app
var app = express();

// Connect with Mongo DB
var mongoUri =  process.env.MONGODB_URI || 'mongodb://localhost/passport';
mongoose.connect(mongoUri);

//Init the middle-ware
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//MIDDLEWARE FOR TROUBLESHOOTING
app.use(function(req,res,next){ //console logs url calls
  console.log(req.method + " " + req.url);
  next();
});

//View Engine
app.set( 'views', path.join(__dirname, 'views'));
app.set( 'view engine', 'jade');

//Serve public files
app.use(express.static(path.join(__dirname, 'public')));

//Initialize session
var sessionSecret = process.env.SessionSecret || require('../APIkeys/config.json').SessionSecret;
app.use(session( { secret: sessionSecret}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Setup local-strategy
require('./config/passport')(passport);

// Routes.js file contains page and API links
require('./routes/routes')(app, passport);

// listen
app.listen(process.env.PORT || 3000 )

