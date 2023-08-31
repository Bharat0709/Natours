import axios from 'axios';
import { showAlert } from './alerts';
const Stripe = require('stripe');

const stripe = new Stripe(
  'pk_test_51NhtG9SJXp1TgrmFXXz7pfCf8doPRxb4tkbOJudXGW4OgjoOL3bgLjg2iXacvpgGPvuR7YEYBWR63XhTcmEx06sp00hYVko1Pk',
);

export const bookTour = async (tourId) => {
  try {
    // 1 get the session from api
    const session = await axios(
      `http://127.0.0.1:8000/api/v1/booking/checkout-session/${tourId}`,
    );
    // 2 create checkout form + charge
    window.location.replace(session.data.session.url);
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
