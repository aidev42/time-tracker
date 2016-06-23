var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for user
var userSchema = mongoose.Schema({
    todoist          : {
        access_token: String
    }
});

// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    console.log('success')
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);