// Load passport local
var TodoistStrategy = require('passport-todoist').Strategy;

//API connections
var TodoistKey = require('../APIkeys/config.json').todoist.appID;
var TodoistSecret = require('../APIkeys/config.json').todoist.appSecret;

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