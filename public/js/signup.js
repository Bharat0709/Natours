/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const signUp = async (name, email, password, passwordConfirm) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/signup',
      data: {
        email,
        password,
        name,
        passwordConfirm,
      },
    });

    console.log(name, email, password, passwordConfirm);

    if (res.data.status === 'success') {
      showAlert(
        'success',
        'User signed up Successfully',
      );
      window.setTimeout(() => {
        location.assign('/');
      }, 500);
    }
  } catch (error) {
    showAlert('error', error);
  }
};
