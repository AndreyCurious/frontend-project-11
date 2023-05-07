import onChange from 'on-change';
import * as yup from 'yup';
import axios from 'axios';
import _ from 'lodash';
import { render, startView, i18nextInstance } from './view.js';
import parser from './parser.js';

const delay = 5000;

const state = {
  validForm: '',
  err: '',
  stateForm: '',
  posts: {
    readed: [],
    all: [],
  },
  feeds: [],
  readedPosts: [],
  modalWindow: '',
};
const watchedState = onChange(state, render);

const createUrl = (link) => {
  let url = new URL('https://allorigins.hexlet.app/get');
  url.searchParams.set('disableCache', 'true');
  url.searchParams.set('url', link);
  url = url.toString();
  if (url[url.length - 1] === 'F') {
    return url.slice(0, -3);
  }
  return url;
};

const handlerWatchBtn = () => {
  const postsBtns = document.querySelectorAll('li>.btn');
  postsBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const closestLink = btn.previousSibling;
      const id = closestLink.getAttribute('data-id');
      const openedPost = state.posts.all.filter((post) => post.idPost === id);
      state.posts.readed.push(id);
      const [post] = openedPost;
      watchedState.modalWindow = post;
    });
  });
};

const checkUpdates = (links) => {
  const promisesOfResponses = links.map((url) => axios.get(createUrl(url)));
  Promise.all(promisesOfResponses)
    .then((responses) => {
      responses.forEach((response) => {
        const responseDom = parser(response);
        const newTitles = [];
        responseDom.querySelectorAll('item>title').forEach((title) => newTitles.push(title.textContent));
        const newPosts = [];
        const { id } = state.feeds
          .filter((feed) => feed.url === response.data.status.url)[0];
        state.posts.all.forEach((post) => {
          if (newTitles.indexOf(post.title) === -1) {
            responseDom.querySelectorAll('item').forEach((responsePost) => {
              if (responsePost.querySelector('title').textContent === post.title) {
                newPosts.push({
                  title: responsePost.querySelector('title').textContent, link: responsePost.querySelector('link').nextSibling.textContent.trim(), description: responsePost.querySelector('description').textContent,
                });
              }
            });
          }
        });

        const postWithIds = newPosts.map((post) => {
          const copyPost = { ...post };
          copyPost.idFeed = id;
          copyPost.idPost = _.uniqueId();
          return copyPost;
        });
        watchedState.posts = {
          all: [...state.posts.all, ...postWithIds],
          readed: state.posts.readed,
        };

        handlerWatchBtn();
      });
      setTimeout(checkUpdates, delay, state.feeds.map((feed) => feed.url));
    }).catch((err) => console.log(err));
};

export default () => {
  startView()
    .then(() => {
      watchedState.stateForm = 'expectation';
      checkUpdates(state.feeds.map((feed) => feed.url));
      const rssForm = document.querySelector('form');
      rssForm.addEventListener('submit', (e) => {
        e.preventDefault();
        watchedState.stateForm = 'processing';
        const url = rssForm.elements.url.value;
        const schema = yup.object().shape({
          url: yup.string().url(i18nextInstance.t('errors.url')).notOneOf(state.feeds.map((feed) => feed.url), i18nextInstance.t('errors.notOneOf')).required(),
        });
        schema.validate({ url })
          .then((result) => {
            watchedState.validForm = 'valid';
            const fullUrl = createUrl(result.url);
            axios.get(fullUrl)
              .then((response) => {
                const responseDom = parser(response);
                const feeds = [];
                const idFeed = _.uniqueId();
                feeds.push({
                  title: responseDom.querySelector('title').textContent, description: responseDom.querySelector('description').textContent, url: result.url,
                });
                const responsePosts = responseDom.querySelectorAll('item');
                const posts = [];
                responsePosts.forEach((responsePost) => {
                  posts.push({
                    title: responsePost.querySelector('title').textContent, link: responsePost.querySelector('link').nextSibling.textContent.trim(), description: responsePost.querySelector('description').textContent,
                  });
                });

                const feedsWithId = feeds.map((feed) => {
                  const copyFeed = { ...feed };
                  copyFeed.idFeed = idFeed;
                  return copyFeed;
                });

                const postWithIds = posts.map((post) => {
                  const copyPost = { ...post };
                  copyPost.idFeed = idFeed;
                  copyPost.idPost = _.uniqueId();
                  return copyPost;
                });
                watchedState.posts = {
                  all: [...state.posts.all, ...postWithIds],
                  readed: state.posts.readed,
                };
                watchedState.feeds = [...state.feeds, ...feedsWithId];

                handlerWatchBtn();

                watchedState.stateForm = 'success';
              })
              .catch((err) => {
                watchedState.stateForm = 'failed';
                if (err.message === 'Network Error') {
                  watchedState.err = i18nextInstance.t('errors.network');
                } else {
                  watchedState.err = i18nextInstance.t('errors.valid');
                }
              });
          })
          .catch((err) => {
            watchedState.stateForm = 'failed';
            const [nameErr] = err.errors;
            watchedState.validForm = 'invalid';
            watchedState.err = nameErr;
          });
      });
    });
};
