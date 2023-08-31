const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// NAME EMAIL PHOT PASSWORD PASSWARD CONFIRM

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter your Name'],
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: [validator.isEmail, 'Please Provide a Valid Email'],
  },
  passwordChangedAt: { type: Date },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    select: false,
    type: String,
    required: [true, 'Please Provide a Password '],
    minlength: 8,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please Confirm Your Passward'],
    validate: {
      //This only works on SAVE
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not same',
    },
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  //only run if password is modified
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);

  // delete the password confirm fieled
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre('find', function (next) {
  // This function will run before any 'find' operation
  this.find({ active: { $ne: false } }); // Modify the query if needed
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changePasswordAfter = function (JWTtimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return JWTtimestamp < changedTimeStamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
