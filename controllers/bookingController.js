const catchAsync = require('./../utils/catchAsync');
const Tour = require('./../models/tourmodel');
const Booking = require('./../models/bookingmodel');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
const Stripe = require('stripe');
exports.getCheckout = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.tourId);
  const stripe = Stripe(
    'sk_test_51NhtG9SJXp1TgrmFVtZp4qQWB2CAukOI0Fxzw8FIwYtU405SgS8d9VRfEMVI7S6Cbmc56oVgbkOgH0zeSYnJHXuz00Tni3zQio',
  );

  // get the cureently bookked toue
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'inr',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
          },
        },
      },
    ],
  }); // create checkout session
  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  const { tour, user, price } = req.query;
  if (!tour && !user && !price) return next();
  await Booking.create({ tour, user, price }); 
  res.redirect(req.originalUrl.split('?')[0]);
});
