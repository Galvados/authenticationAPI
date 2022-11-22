const mongoose = require('mongoose');

// User schema
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  refreshTokens: [{
    expiresAt: {
      type: Date,
      required: true
    },
    token:{type: String},
    invalidated: {type: Boolean, dafault: false},
    applicationType: {type: String}
  }]
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

module.exports = User;