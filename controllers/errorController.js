const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleJWTError = (err) => {
  new AppError('Invalid token. Please login again!!', 401);
};

const handleJWTExpiredError = (err) => {
  new AppError('Your Token is Expired Please Login Again', 401);
};

const handleValidatorErrorDB = (err) => {
  const message = `Invalid Input Data  ${errors.join('. ')}`;
  const errors = Object.values(err.errors).map((el) => el.message);
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate fields value ${value}`;
  return new AppError(message, 400);
};

const sendErrorDev = (req, res, err) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack,
    });
  }
  return res.status(err.statusCode).render('error', {
    title: 'Something Went Wrong',
    msg: err.message,
  });
};

const sendErrorProd = (err, res) => {
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } else {
      return res.status(500).json({
        status: 'error',
        message: 'Something went Wrong',
      });
    }
  }
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: 'Please try Again Later',
    });
  } else {
    return res.status(500).json({
      status: 'error',
      message: 'Something went Wrong',
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(req, res, err);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidatorError') error = handleValidatorErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError(error);
    sendErrorProd(error, res);
    if (error.name === 'TokenExpiredError')
      error = handleJWTExpiredError(error);
  }
};
