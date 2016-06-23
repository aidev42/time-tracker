// Load passport local
var TwitterStrategy = require('passport-twitter').Strategy;
var TodoistStrategy = require('passport-todoist').Strategy;
var localStrategy = require('passport-local').Strategy;

//API connections to twitter and facebook
var TwitterKey = require('../APIkeys/config.json').twitter.appID;
var TwitterSecret = require('../APIkeys/config.json').twitter.appSecret;
var TwitterCallback = require('../APIkeys/config.json').twitter.callback;

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
      done(null, user._id);
  });

  // Deserialize user
  passport.deserializeUser(function(id, done){
      User.findById(id, function(err, user){
        done(err, user);
      });
  });

  // Passport signup
  passport.use('local-signup', new localStrategy({
      usernameField : 'email',
      passwordField : 'password',
      passReqToCallback: true
    },
    function( req, email, password, done){

        // Check that the email is in the right format
        if( !validator.isEmail(email) ){
          return done(null, false, req.flash('loginMessage','That is not a valid email address'));
        }

        // Check that the password is at least 8 chars
        if( password.length < 8 ){
          return done(null, false, req.flash('loginMessage','The password needs to be 8 chars long'));
        }

        process.nextTick(function(){
          User.findOne( {'local.email' : email }, function(err, user){
            if(err){
              return done(err);
            }
            if(user){
              return done(null, false, req.flash('loginMessage','That email is already in use'));
            }else{
              // User.create({}, function(){})
              var newUser = new User();
              newUser.username = ''
              console.log(newUser.username);
              newUser.local.email = email;
              newUser.local.password = newUser.generateHash(password);
              newUser.save(function(err){
                if(err){
                  console.log(err);
                }
                return done(null, newUser, req.flash('loginMessage', 'Logged in successfully'));
              });
            }
          });
        });
    }));

  // Passport login
  passport.use('local-login', new localStrategy({
      usernameField : 'email',
      passwordField : 'password',
      passReqToCallback: true
    },
    function( req, email, password, done){
        process.nextTick(function(){
          User.findOne( {'local.email' : email }, function(err, user){
            if(err){
              return done(err);
            }

            if(!user){
              return done(null,false, req.flash('loginMessage', 'sorry no one by that email'));
            }

            if(!user.validPassword(password)){
              return done(null,false, req.flash('loginMessage', 'sorry wrong password'));
             }

            return done(null, user, req.flash('loginMessage', 'Logged in successfully'));
          });
        });
    }));

  // Twitter Login
  passport.use('twitter', new TwitterStrategy({
    consumerKey: TwitterKey,
    consumerSecret: TwitterSecret,
    callbackURL: TwitterCallback
  },
  function(token, tokenSecret, profile, cb) {
    // User.findOrCreate({ twitterId: profile.id }, function (err, user) {
    //   return cb(err, user);
    // });
    var newUser = new User();
    newUser.twitter.id = profile.id;
    newUser.save(function(err){
      if(err){
        console.log(err);
      }
    });

    User.findOne({ 'twitter.id': profile.id }, function (err, user) {
      return cb(err, user);
    });
  }));

  passport.use('todoist', new TodoistStrategy({
    clientID: TodoistKey,
    clientSecret: TodoistSecret,
  },
  function(accessToken, refreshToken, todoist, done){
    User.findOne({
      'todoist.access_token': todoist.access_token
    }, function(err, user){
      if(err){
        console.log('error')
        return done(err);
      }
      if(!user){
        console.log('should be creating new user')
        var user = new User({
          'todoist.access_token': todoist.access_token
        });
        console.log('user about to be saved' + user)
        user.save(function(err){
          if(err) console.log('error saving user' + err);
          return done(err, user);
        });
      } else{
        console.log('user already exists')
        return done(err, user);
      }
    });
  }));


       // newUser.save(function(err){
       //    if(err){
       //      console.log(err);
       //    }
       //    return done(null, newUser, req.flash('loginMessage', 'Logged in successfully'));
       //  });

    // User.findOne( {'twitter.id' : profile.id }, function(err, user){
    //   if(err){
    //     return done(err);
    //   }
    //   if(user){
    //     return done(null, false, req.flash('loginMessage','That email is already in use'));
    //   }else{
    //     // User.create({}, function(){})
    //     var newUser = new User();
    //     newUser.username = 'user'+ userVar;
    //     userVar ++;
    //     console.log(newUser.username);
    //     newUser.twitter.id = profile.id;
    //     newUser.save(function(err){
    //       if(err){
    //         console.log(err);
    //       }
    //       return done(null, newUser, req.flash('loginMessage', 'Logged in successfully'));
    //     });
    //   }
    // });
}