/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';
import { updateData } from './updateSettings';

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:8000/api/v1/users/login',
      data: {
        email,
        password,
      },
    });
    console.log(email , password);

    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    console.error('Login error:', err);
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:8000/api/v1/users/logout',
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Logged Out successfully');
      window.setTimeout(() => {
        location.assign('/login');
      }, 1500);
    } else {
      showAlert('error', 'Logout failed: Status is not "success".');
    }
  } catch (err) {
    showAlert('error', 'Error logging out! Try again.');
  }
};
