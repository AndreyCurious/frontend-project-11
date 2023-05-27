import * as yup from 'yup';
import axios from 'axios';
import _ from 'lodash';
import { watch, startAppInterface, i18nextInstance } from './view.js';
import parser from './parser.js';

const delay = 5000;

const state = {
  validForm: 'waitingData',
  err: null,

  addRssProcessState: 'filling',

  posts: [],
  feeds: [],
  readedPostsIds: [],
  modalWindowId: '',
};
export const watchedState = watch(state);

const createSchema = () => {
  const schema = yup.object().shape({
    url: yup.string().url(i18nextInstance.t('errors.url')).notOneOf(state.feeds.map((feed) => feed.url), i18nextInstance.t('errors.notOneOf')).required(),
  });
  return schema;
};

const addIdForPosts = (posts, id) => posts.map((post) => ({
  ...post,
  idFeed: id,
  idPost: _.uniqueId(),
}));

const getProxiedUrl = (link) => {
  const url = new URL('https://allorigins.hexlet.app/get');
  url.searchParams.set('url', link);
  url.searchParams.set('disableCache', true);
  return url.href;
};

const createUrl = (link) => {
  const checkSlash = (item) => (item.endsWith('/') ? item.slice(0, -1) : item);
  const url = getProxiedUrl(checkSlash(link));

  return url;
};

const addEventForPosts = () => {
  const posts = document.querySelector('.ulPosts');
  posts.addEventListener('click', (e) => {
    const btn = e.target;
    const closestLink = btn.previousSibling;
    const id = closestLink.getAttribute('data-id');
    state.readedPostsIds.push(id);
    watchedState.modalWindowId = id;
  });
};

const checkUpdates = (links) => {
  const promisesOfResponses = links.map((url) => axios.get(createUrl(url)));
  Promise.all(promisesOfResponses)
    .then((responses) => {
      responses.forEach((response) => {
        const { posts } = parser(response);

        const { id } = state.feeds
          .find((feed) => feed.url === response.data.status.url);

        const feedPosts = state.posts.filter((post) => post.feedId === id);

        const newPosts = posts
          .filter((newPost) => !(feedPosts.some((feedPost) => feedPost.title === newPost.title)));

        const postWithIds = addIdForPosts(newPosts, id);
        watchedState.posts = [...state.posts, ...postWithIds];

        addEventForPosts();
      });
      setTimeout(checkUpdates, delay, state.feeds.map((feed) => feed.url));
    }).catch((err) => console.error(err));
};

export default () => {
  startAppInterface()
    .then(() => {
      checkUpdates(state.feeds.map((feed) => feed.url));
      const rssForm = document.querySelector('form');
      rssForm.addEventListener('submit', (e) => {
        e.preventDefault();
        watchedState.addRssProcessState = 'processing';
        const url = rssForm.elements.url.value;
        const schema = createSchema();
        schema.validate({ url })
          .then((result) => {
            watchedState.validForm = 'valid';
            const fullUrl = createUrl(result.url);
            axios.get(fullUrl)
              .then((response) => {
                const { posts, feed } = parser(response, result.url);
                const idFeed = _.uniqueId();

                feed.idFeed = idFeed;
                const postWithIds = addIdForPosts(posts, idFeed);

                watchedState.posts = [...state.posts, ...postWithIds];
                watchedState.feeds.push(feed);

                addEventForPosts();

                watchedState.addRssProcessState = 'success';
              })
              .catch((err) => {
                watchedState.addRssProcessState = 'failed';
                if (err.message === 'Network Error') {
                  watchedState.err = i18nextInstance.t('errors.network');
                } else if (err.message === 'unableToParse') {
                  watchedState.err = i18nextInstance.t('errors.valid');
                } else {
                  watchedState.err = i18nextInstance.t('errors.mistake');
                }
              });
          })
          .catch((err) => {
            watchedState.addRssProcessState = 'failed';
            const [nameErr] = err.errors;
            watchedState.validForm = 'invalid';
            watchedState.err = nameErr;
          });
      });
    });
};
