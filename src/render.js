export default (path, value) => {
  const inputForm = document.querySelector('#url-input');
  const err = document.querySelector('.feedback');
  if (path === 'rssForm.err') {
    inputForm.classList.add('is-invalid');
    err.textContent = value;
  } else {
    inputForm.value = '';
    inputForm.focus();
    err.textContent = '';
    inputForm.classList.remove('is-invalid');
  }
};
