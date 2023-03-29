import onChange from 'on-change';
import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import path from 'path-browserify';
import render from './render.js';
import ru from './locales/ru.js';

const i18nextInstance = i18next.createInstance();
i18nextInstance.init({
  lng: 'ru',
  debug: true,
  resources: {
    ru,
  },
})
  .then(() => {
    document.querySelector('.full-article').textContent = i18nextInstance.t('readFull');
    document.querySelector('.btn-secondary').textContent = i18nextInstance.t('close');
    document.querySelector('[for="url-input"]').textContent = i18nextInstance.t('link');
    document.querySelector('h1').textContent = i18nextInstance.t('rss');
    document.querySelector('.lead').textContent = i18nextInstance.t('title');
    document.querySelector('.mt-2').textContent = i18nextInstance.t('example');
    document.querySelector('#created').textContent = i18nextInstance.t('created');
    document.querySelector('.footer>div>div>a').textContent = i18nextInstance.t('me');
    document.querySelector('[type="submit"]').textContent = i18nextInstance.t('add');

    const form = document.querySelector('form');
    const state = {
      rssForm: {
        fids: [],
        url: '',
        err: '',
      },
    };

    const watchedState = onChange(state, render);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const schema = yup.object().shape({
        url: yup.string().url(i18nextInstance.t('errors.url')).notOneOf(state.rssForm.fids, i18nextInstance.t('errors.notOneOf')),
      });
      schema.validate({ url: form.elements.url.value })
        .then((result) => {
          if (state.rssForm.fids.indexOf(result.url) === -1) {
            state.rssForm.fids.push(result.url);
          }
          watchedState.rssForm.url = result.url;
          const pathName = path.join('https://allorigins.hexlet.app/get?disableCache=true&url=', result.url);
          console.log(pathName);
          axios.get(pathName)
            .then((response) => {
              console.log(response);
            });
        })
        .catch((error) => {
          const [nameErr] = error.errors;
          watchedState.rssForm.err = nameErr;
        });
    });
  });
