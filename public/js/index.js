import '@babel/polyfill';
import { login } from './login';
import { logout } from './login';
import { signUp } from './signup';
import { bookTour } from './stripe';
import { updateSettings } from './updateSettings';

const Signupform = document.querySelector('.form--signup');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');

if (loginForm)
  loginForm.addEventListener('submit', (e) => {
    const email = document.querySelector('#email').value;
    const password = document.querySelector('#password').value;
    e.preventDefault();
    login(email, password);
  });

if (logOutBtn) logOutBtn.addEventListener('click', logout);

if (userDataForm)
  userDataForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    console.log(form);
    await updateSettings(form, 'data');
  });

if (userPasswordForm)
  userPasswordForm.addEventListener('submit', (e) => {
    const savepasswordbutton = document.querySelector('.btn--save-password');
    savepasswordbutton.textContent = 'Updating....';
    e.preventDefault();
    const passwordCurrent = document.querySelector('#password-current').value;
    const password = document.querySelector('#password').value;
    const passwordConfirm = document.querySelector('#password-confirm').value;
    updateSettings({ passwordCurrent, password, passwordConfirm }, 'password');
    savepasswordbutton.textContent = 'Save Password';
  });

if (bookBtn)
  bookBtn.addEventListener('click', (e) => {
    e.target.textContent = 'processing';
    const { tourId } = e.target.dataset;
    bookTour(tourId);
  });

if (Signupform) {
  Signupform.addEventListener('submit', async (e) => {
    console.log('Submitted');
    const email = Signupform.elements['email'].value;
    const password = Signupform.elements['password'].value;
    const passwordConfirm = Signupform.elements['passwordConfirm'].value;
    const name = Signupform.elements['name'].value;
    e.preventDefault();
    console.log(email, password, passwordConfirm, name);
    await signUp(name, email, password, passwordConfirm);
  });
}
