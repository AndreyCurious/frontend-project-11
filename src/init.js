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
  fullPosts: false,
  fullFeeds: false,
  readState: [],
  readWatched: [],
  readNow: '',
};
let uniqIdFeeds = 0;
let uniqIdPosts = 0;
const watchedState = onChange(state, render);

const checkUpdates = (links) => {
  console.log(state.rssForm.links);
  uniqIdPosts = 0;
  uniqIdFeeds = 0;
  state.posts = [];
  state.fullPosts = [];
  links.forEach((link) => {
    let url = new URL('https://allorigins.hexlet.app/get');
    url.searchParams.set('disableCache', 'true');
    url.searchParams.set('url', link);
    url = url.toString();
    axios.get(url)
      .then((response) => {
        const responseDom = parser(response);
        const posts = responseDom.querySelectorAll('item');
        uniqIdFeeds += 1;
        posts.forEach((item) => {
          uniqIdPosts += 1;
          state.posts.push({
            idFeed: uniqIdFeeds, idPost: uniqIdPosts, title: item.querySelector('title').textContent, link: item.querySelector('link').nextSibling.textContent, description: item.querySelector('description').textContent,
          });
        });
      })
      .then(() => {
        if (links[links.length - 1] === link) {
          watchedState.fullPosts = state.posts;
          watchedState.readWatched = [];

          const postsBtn = document.querySelectorAll('li>.btn');
          postsBtn.forEach((item) => {
            item.addEventListener('click', () => {
              const id = item.getAttribute('data-id');
              const readPost = state.fullPosts.filter((post) => post.idPost === Number(id));
              watchedState.readNow = readPost;
              state.readNow = [];
              state.readState.push(readPost[0]);
            });
          });
          watchedState.readWatched = state.readState;
        }
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
        url: yup.string().url(i18nextInstance.t('errors.url')).notOneOf(state.rssForm.links, i18nextInstance.t('errors.notOneOf')).required(),
      });
      schema.validate({ url: form.elements.url.value })
        .then((result) => {
          let url = new URL('https://allorigins.hexlet.app/get');
          url.searchParams.set('disableCache', 'true');
          url.searchParams.set('url', result.url);
          url = String(url);
          axios.get(url)
            .then((response) => {
              const responseDom = parser(response);
              uniqIdFeeds += 1;
              state.feeds.push({ id: uniqIdFeeds, title: responseDom.querySelector('title').textContent, description: responseDom.querySelector('description').textContent });
              const posts = responseDom.querySelectorAll('item');
              posts.forEach((item) => {
                uniqIdPosts += 1;
                state.posts.push({
                  idFeed: uniqIdFeeds, idPost: uniqIdPosts, title: item.querySelector('title').textContent, link: item.querySelector('link').nextSibling.textContent, description: item.querySelector('description').textContent,
                });
              });
              watchedState.rssForm.valid = 'valid';

              if (state.rssForm.links.indexOf(result.url) === -1) {
                state.rssForm.links.push(result.url);
              }
              watchedState.rssForm.url = result.url;
              watchedState.rssForm.url = 'loadSuccess';
              state.fullPosts = [];
              state.fullFeeds = [];
              watchedState.fullPosts = state.posts;
              watchedState.fullFeeds = state.feeds;
            })
            .then(() => {
              const postsBtn = document.querySelectorAll('li>.btn');
              postsBtn.forEach((item) => {
                item.addEventListener('click', () => {
                  const id = item.getAttribute('data-id');
                  const readPost = state.fullPosts.filter((post) => post.idPost === Number(id));
                  watchedState.readNow = readPost;
                  state.readNow = [];
                  state.readState.push(readPost[0]);
                });
              });
              if (state.checkUpdates === 'no') {
                state.checkUpdates = 'yes';
                checkUpdates(state.rssForm.links);
              }
            })
            .catch((err) => {
              console.log(err);
              if (err.message === 'Network Error') {
                watchedState.rssForm.err = i18nextInstance.t('errors.network');
              } else {
                watchedState.rssForm.err = i18nextInstance.t('errors.valid');
              }
            });
        })
        .catch((error) => {
          const [nameErr] = error.errors;
          watchedState.rssForm.err = nameErr;
        });
    });
  });
