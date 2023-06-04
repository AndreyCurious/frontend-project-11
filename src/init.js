import * as yup from 'yup';
import axios from 'axios';
import _ from 'lodash';
import { watch, startAppInterface, i18nextInstance } from './view.js';
import parser from './parser.js';

const validateUrl = (url, feeds) => {
  const feedUrl = feeds.map((feed) => feed.url);
  const schema = yup.string().url('url').notOneOf(feedUrl, 'notOneOf').required();
  return schema.validate(url)
    .then(() => null)
    .catch((e) => e.message);
};

const addEventForPosts = (state) => {
  const watchedState = watch(state);
  const posts = document.querySelector('.ulPosts');
  posts.addEventListener('click', (e) => {
    const btn = e.target;
    const closestLink = btn.previousSibling;
    const id = closestLink.getAttribute('data-id');
    state.readedPostsIds.add(id);

    watchedState.modalWindowId = id;
  });
};

const addIdForPosts = (posts, id) => posts.map((post) => ({
  ...post,
  idFeed: id,
  id: _.uniqueId(),
}));

const getProxiedUrl = (link) => {
  const url = new URL('https://allorigins.hexlet.app/get');
  url.searchParams.set('url', link);
  url.searchParams.set('disableCache', true);
  return url.href.toString();
};

const createUrl = (link) => {
  const checkSlash = (item) => (item.endsWith('/') ? item.slice(0, -1) : item);
  const url = getProxiedUrl(checkSlash(link));

  return url;
};

const checkUpdates = (delay, state) => {
  const watchedState = watch(state);
  const links = state.feeds.map((feed) => feed.url);
  const promisesOfResponses = links.map((url) => axios.get(createUrl(url)));
  Promise.all(promisesOfResponses)
    .then((responses) => {
      responses.forEach((response) => {
        const { posts } = parser(response.data.contents);

        const { id } = state.feeds
          .find((feed) => feed.url === response.data.status.url);

        const feedPosts = state.posts.filter((post) => post.feedId === id);

        const newPosts = posts
          .filter((newPost) => !(feedPosts.some((feedPost) => feedPost.title === newPost.title)));

        const postWithIds = addIdForPosts(newPosts, id);
        watchedState.posts = [...state.posts, ...postWithIds];
      });
      setTimeout(
        checkUpdates,
        delay,
        delay,
        state,
      );
    }).catch((error) => console.error(error));
};

export default () => {
  const state = {
    validForm: 'waitingData',
    errorApp: null,

    addRssProcessState: 'filling',

    posts: [],
    feeds: [],
    readedPostsIds: new Set(),
    modalWindowId: '',
  };

  const delay = 5000;
  const watchedState = watch(state);

  startAppInterface()
    .then(() => {
      checkUpdates(delay, state);
      const rssForm = document.querySelector('form');
      rssForm.addEventListener('submit', (e) => {
        e.preventDefault();
        watchedState.addRssProcessState = 'processing';
        const url = rssForm.elements.url.value;
        validateUrl(url, state.feeds)
          .then((error) => {
            if (!error) {
              watchedState.validForm = 'valid';
              const fullUrl = createUrl(url);
              axios.get(fullUrl)
                .then((response) => {
                  const { posts, feed } = parser(response.data.contents);
                  feed.url = url;

                  const idFeed = _.uniqueId();

                  feed.idFeed = idFeed;
                  const postWithIds = addIdForPosts(posts, idFeed);

                  watchedState.posts = [...state.posts, ...postWithIds];
                  if (state.feeds.length === 0) {
                    addEventForPosts(state);
                  }
                  watchedState.feeds.push(feed);

                  watchedState.addRssProcessState = 'success';
                })
                .catch((err) => {
                  watchedState.addRssProcessState = 'failed';
                  if (err.message === 'Network Error') {
                    watchedState.errorApp = i18nextInstance.t('errors.network');
                  } else if (err.message === 'unableToParse') {
                    watchedState.errorApp = i18nextInstance.t('errors.valid');
                  } else {
                    watchedState.errorApp = i18nextInstance.t('errors.mistake');
                  }
                });
            } else {
              watchedState.addRssProcessState = 'failed';
              watchedState.validForm = 'invalid';
              watchedState.errorApp = i18nextInstance.t(`errors.${error}`);
            }
          });
      });
    });
};
