/*Notes to self:
-when migrating to production must update links:
  - mongoose.connect
-possibly need to update default session secret, though passport may overwrite this anyway
*/

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
mongoose.connect('mongodb://localhost/timetracker');

//Init the middle-ware
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//View Engine
app.set( 'views', path.join(__dirname, 'views'));
app.set( 'view engine', 'jade');

//Initialize session
app.use(session( { secret: 'IwantmyMTV'}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Setup local-strategy
require('./config/passport')(passport);

// Routes.js file contains page and API links
require('./routes/routes')(app, passport);

//API keys
require('./APIkeys/config.json')

// listen
app.listen( 3001, function(){
    console.log('listening on port 3001');
});