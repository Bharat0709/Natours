import axios from 'axios';
import { showAlert } from './alerts';

export const updateSettings = async (data, type) => {
  console.log('Update Settings is Called');
  console.log(data);
  try {
    const url =
      type === 'password'
        ? 'http://127.0.0.1:8000/api/v1/users/updatemypassword'
        : 'http://127.0.0.1:8000/api/v1/users/updateme';
    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });

    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} Updated Successfully`);
      window.setTimeout(() => {
        location.reload();
      }, 1000);
    }
    // Do something with the response if needed
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
