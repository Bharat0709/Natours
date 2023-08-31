const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');
const Router = express.Router();

Router.post('/signup', authController.signup);
Router.post('/login', authController.login);
Router.get('/logout', authController.logout);
Router.post('/forgotpassword', authController.forgotPassword);
Router.patch('/resetpassword/:token', authController.resetPassword);

Router.use(authController.protect);

Router.patch(
  '/updateme',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe,
);
Router.delete('/deleteme', userController.deleteMe);
Router.patch('/updatemypassword', authController.updatePassword);
Router.get('/me', userController.getMe, userController.getUser);

Router.use(authController.restrictTo('admin'));
Router.route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
Router.route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = Router;
