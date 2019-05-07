const mongoose = require('mongoose');

// User Schema
const UserSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name:{
    type: String,
    required: true
  },
  email:{
    type: String,
    required: true
  },
  username:{
    type: String,
    required: true
  },
  password:{
    type: String,
    required: true
  },
  confirmation:{
    type: Boolean,
    required: true
  }
});

var User = mongoose.model('User', UserSchema);
 module.exports = User;