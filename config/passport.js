// Load passport strategies
var TodoistStrategy = require('passport-todoist').Strategy;
var TrelloStrategy = require('passport-trello').Strategy

//API connections
var TodoistKey = process.env.TodoistKey || require('../APIkeys/config.json').todoist.appID;
var TodoistSecret = process.env.TodoistSecret || require('../APIkeys/config.json').todoist.appSecret;

var TrelloKey = process.env.TrelloKey || require('../APIkeys/config.json').trello.appID;
var TrelloSecret = process.env.TrelloSecret || require('../APIkeys/config.json').trello.appSecret;
var TrelloCallback = process.env.TrelloCallback || require('../APIkeys/config.json').trello.callback;


// Load validator
var validator = require('validator');

// Load user model
var User = require('../model/user');

module.exports = function( passport ) {
  //Passport must always have two funtions, serialize and deserialize user

  // Serialize user
  passport.serializeUser( function( user, done){
      //null means there is no error, callback has err,req by standard
      return done(null, user._id);
  });

  // Deserialize user
  passport.deserializeUser(function(id, done){
    User.findById(id, function(err, user){
      return done(err, user);
    });
  });

  //Trello Login
  passport.use('trello', new TrelloStrategy({
    consumerKey: TrelloKey,
    consumerSecret: TrelloSecret,
    callbackURL: TrelloCallback,
    passReqToCallback: true,
    trelloParams: {
        scope: "read,write",
        name: "Time Tracker",
        expiration: "never"
      }
    }, function(req, token, tokenSecret, profile, done){
          User.findOne({
            'trello.id': profile.id
          },
          function(err, user){
            if(err){ return done(err); }

            if(!user){
              var user = new User({
                'trello.full_name' : profile.displayName,
                'trello.id': profile.id,
                'trello.access_token': token,
                'trello.token_secret': tokenSecret
              });
              user.save(function(err){
                if(err) console.log('error saving user' + err);
                return done(err, user);
              });
            } else {
                // user already exists, update access token and secret
                user.trello.access_token = token;
                user.trello.token_secret = tokenSecret;
                user.save(function(err){
                if(err) console.log('error saving user' + err);
                return done(err, user);
                });
            }
          });
        }
      ));

  // Todoist Login
  passport.use('todoist', new TodoistStrategy({
    clientID: TodoistKey,
    clientSecret: TodoistSecret,
  },
  function(accessToken, refreshToken, todoist, done){
    User.findOne({
      'todoist.id': todoist.id
    },
    function(err, user){
      if(err){ return done(err); }

      if(!user){
        var user = new User({
          'todoist.full_name' : todoist.full_name,
          'todoist.email': todoist.email,
          'todoist.id': todoist.id,
          'todoist.inbox_project': todoist.inbox_project,
          'todoist.access_token': todoist.access_token,
          'todist.sync_token': todoist.sync_token
        });
        user.save(function(err){
          if(err) console.log('error saving user' + err);
          return done(err, user);
        });
      } else {
          // update access and sync tokens
          user.todoist.access_token = todoist.access_token;
          user.todoist.sync_token = todoist.sync_token;
          user.save(function(err){
            if(err) console.log('error saving user' + err);
            return done(err, user);
          });
      }
    });
  }));
}