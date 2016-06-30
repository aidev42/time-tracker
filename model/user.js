var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for user
var userSchema = mongoose.Schema({
  todoist: {
    full_name: String,
    email: String,
    id: Number,
    inbox_project: Number,
    access_token: String,
    sync_token: String,
  },
  trello:{
    full_name: String,
    id: String,
    access_token: String,
    token_secret: String
  }

});

// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
    console.log('success')
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);