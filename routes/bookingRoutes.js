const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const bookingController = require('./../controllers/bookingController');
const { router } = require('../app');

const Router = express.Router();

Router.get(
  '/checkout-session/:tourId',
  authController.protect,
  bookingController.getCheckout,
);

module.exports = Router;
