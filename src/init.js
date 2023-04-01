import onChange from 'on-change';
import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import render from './render.js';
import ru from './locales/ru.js';
import parser from './parser.js'

export const i18nextInstance = i18next.createInstance();
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
    document.querySelector('[type="submit"]').textContent = i18nextInstance.t('add')  ;

    let uniqIdFeeds = 0;

    const form = document.querySelector('form');
    const state = {
      rssForm: {
        valid: '',
        links: [],
        url: '',
        err: '',
      },
      feeds: [],
      posts: [],
    };

    const watchedState = onChange(state, render);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const schema = yup.object().shape({
        url: yup.string().url(i18nextInstance.t('errors.url')).notOneOf(state.rssForm.links, i18nextInstance.t('errors.notOneOf')),
      });
      schema.validate({ url: form.elements.url.value })
        .then((result) => {
          if (state.rssForm.links.indexOf(result.url) === -1) {
            state.rssForm.links.push(result.url);
          }
          watchedState.rssForm.url = result.url;
          const url = new URL('https://allorigins.hexlet.app/get');
          url.searchParams.set('disableCach', 'true');
          url.searchParams.set('url', result.url);
          axios.get(url)
            .then((response) => {
              watchedState.rssForm.valid = 'valid';
              let uniqIdPosts = 0;
              const responseDom = parser(response);
              uniqIdFeeds += 1;
              watchedState.feeds.push({ id: uniqIdFeeds, title: responseDom.querySelector('title').textContent, description: responseDom.querySelector('description').textContent })
              const posts = responseDom.querySelectorAll('item');
              posts.forEach((item) => {
                uniqIdPosts += 1;
                watchedState.posts.push({ idFeed: uniqIdFeeds, idPost: uniqIdPosts, title: item.querySelector('title').textContent, link: item.querySelector('link').nextSibling.textContent })
              })
            })
            .catch((err) => {
              watchedState.rssForm.err = err;
            })
        })
        .catch((error) => {
          const [nameErr] = error.errors;
          watchedState.rssForm.err = nameErr;
        });
    });
  });
