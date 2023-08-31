const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewRouter = require('./../routes/reviewRoutes');
const { router } = require('../app');

const Router = express.Router();

Router.use('/:tourId/reviews', reviewRouter);

Router.route('/monthly-plan/:year').get(
  authController.protect,
  authController.restrictTo('admin', 'lead-guide', 'guide'),
  tourController.getMontlyPlan,
);

Router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(
  tourController.getToursWithin,
);

Router.route('/distance/:latlng/unit/:unit').get(tourController.getDistances);

Router.route('/')
  .get(tourController.getallTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour,
  );

Router.route('/tour-stats').get(tourController.getTourStats);
Router.route('/top-5-cheap').get(
  tourController.aliasTopTours,
  tourController.getallTours,
);

Router.route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.updateTour,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour,
  );

module.exports = Router;
