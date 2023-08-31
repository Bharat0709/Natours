const User = require('./../models/usermodel');
const jwt = require('jsonwebtoken');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const { promisify } = require('util');
const Email = require('../utils/email');
const { CLIENT_RENEG_LIMIT } = require('tls');
const crypto = require('node:crypto');
const cookie = require('cookie-parser');

const signToken = (id) => {
  return jwt.sign(
    {
      id,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN },
  );
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }
  user.password = undefined;
  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

// exports.signup = catchAsync(async (req, res, next) => {
//   const newUser = await User.create(req.body);
//   const url = `${req.protocol}://${req.get('host')}/me`;
//   console.log(url);
//   await new Email(newUser, url).sendWelcome();
//   createSendToken(newUser, 201, res);
// });

exports.signup = catchAsync(async (req, res, next) => {
  const user = new User({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  const data = await user.save();

  const url = `${req.protocol}://${req.get('host')}/me`;

  // await new Email(User, url).sendWelcome();

  const userObj = {
    _id: data._id,
    name: data.name,
    email: data.email,
  };
  createSendToken(userObj, 200, res);
  // res.status(200).json({
  //   message: 'User signed up successfully',
  //   token: jwt.signToken(userObj, req, res),
  //   userObj,
  // });
});

// LOGGING IN THE USER
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // IF email and password exists
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }
  // check user exists and password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or Password'), 401);
  }

  createSendToken(user, 200, res);
});

// PROTECTING THE USER FROM GETTING THE TOURS IF THEY ARE NOT LOGGED IN
exports.protect = catchAsync(async (req, res, next) => {
  let token;
  // 1. Get  token and check if it exixts
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('You are not logged in Login to Get Access'), 401);
  }

  // 2. Validate the token getting the user id using the token

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3. Check If User Exists
  const freshUser = await User.findById(decoded.id);
  res.locals.user = freshUser;
  res.user = freshUser;

  if (!freshUser) {
    return next(
      new AppError('The User Belonging to this token does not exists', 401),
    );
  }
  // 4. Check if User Changed Password after token is issued
  if (freshUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError('User Recently Changed Password!! Please Login Again', 401),
    );
  }
  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = freshUser;
  next();
});

// RESTRICTING THE USER FROM DELETING THE TOURS BASEDON THEIR ROLES
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based in given email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with this email Address', 404));
  }

  // 2. Generate new randon reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3, send it to users email
  const resetURL = `${req.protocol}://${req.get(
    'host',
  )}/api/v1/users/resetpassword/${resetToken}`;

  const message = `Forgot your password? Submit a patch request with new Password and paswordconfirm to ${resetURL}. \n if you didn't requested thia mail , please ignore this mail`;
  try {
    await new Email(user, resetURL).sendPasswordReset();
    res.status(200).json({
      status: 'success',
      message: 'Token send to mail',
    });
  } catch (err) {
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the mail please try again later',
        500,
      ),
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  // GET USER BASED ON THE TOKEN
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  // IF TOKEN HAS NOT EXPIRED , THERE IS A USER SET THE NEW PASSWORD
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // GET USER FORM COLLECTION
  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }

  // CHECK IF POSTED PASSWORD IS CORRECT
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  console.log('Password Updated!!');
  createSendToken(user, 200, res);
  // IF PASSWROD IS CORRECT UPDATE THE PASSWORD
});

exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );

      // 2) Check if user still exists
      const user = await User.findById(decoded.id);
      res.locals.user = user;
      res.user = user;
      return next();
      if (!user) {
        console.log('No User Found');
        return next();
      }

      // 3) Check if user changed password after the token was issued
      if (user.changedPasswordAfter(decoded.iat)) {
        return next();
      }
    } catch (err) {
      return next();
    }
  }
  return next();
};

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedOut', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: 'success',
  });
};
