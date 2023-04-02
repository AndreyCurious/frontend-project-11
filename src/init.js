import onChange from 'on-change';
import * as yup from 'yup';
import axios from 'axios';
import { render, startView, i18nextInstance } from './view.js';
import parser from './parser.js';

const state = {
  rssForm: {
    valid: '',
    links: [],
    url: '',
    err: '',
  },
  checkUpdates: 'no',
  feeds: [],
  posts: [],
};
let uniqIdFeeds = 0;
let uniqIdPosts = 0;
const watchedState = onChange(state, render);
const checkUpdates = (links) => {
  watchedState.posts = [];
  links.forEach((link) => {
    const url = new URL('https://allorigins.hexlet.app/get');
    url.searchParams.set('disableCach', 'true');
    url.searchParams.set('url', link);
    axios.get(url)
      .then((response) => {
        const responseDom = parser(response);
        const posts = responseDom.querySelectorAll('item');
        posts.forEach((item) => {
          uniqIdPosts += 1;
          watchedState.posts.push({
            idFeed: uniqIdFeeds, idPost: uniqIdPosts, title: item.querySelector('title').textContent, link: item.querySelector('link').nextSibling.textContent,
          });
        });
      })
      .catch((err) => {
        watchedState.rssForm.err = err;
      });
  });
  setTimeout(checkUpdates, 5000, state.rssForm.links);
};

startView()
  .then(() => {
    const form = document.querySelector('form');

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
              const responseDom = parser(response);
              uniqIdFeeds += 1;
              watchedState.feeds.push({ id: uniqIdFeeds, title: responseDom.querySelector('title').textContent, description: responseDom.querySelector('description').textContent });
              const posts = responseDom.querySelectorAll('item');
              posts.forEach((item) => {
                uniqIdPosts += 1;
                watchedState.posts.push({
                  idFeed: uniqIdFeeds, idPost: uniqIdPosts, title: item.querySelector('title').textContent, link: item.querySelector('link').nextSibling.textContent,
                });
              });
            })
            .catch((err) => {
              watchedState.rssForm.err = err;
            });
          if (state.checkUpdates === 'no') {
            state.checkUpdates = 'yes';
            setTimeout(checkUpdates, 5000, state.rssForm.links);
          }
        })
        .catch((error) => {
          const [nameErr] = error.errors;
          watchedState.rssForm.err = nameErr;
        });
    });
  });
