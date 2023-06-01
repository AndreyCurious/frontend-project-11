import * as yup from 'yup';
import axios from 'axios';
import _ from 'lodash';
import { watch, startAppInterface, i18nextInstance } from './view.js';
import parser from './parser.js';

const createSchema = (state) => {
  const schema = yup.object().shape({
    url: yup.string().url(i18nextInstance.t('errors.url')).notOneOf(state.feeds.map((feed) => feed.url), i18nextInstance.t('errors.notOneOf')).required(),
  });
  return schema;
};

const addEventForPosts = (state, watchedState) => {
  const posts = document.querySelector('.ulPosts');
  posts.addEventListener('click', (e) => {
    const btn = e.target;
    const closestLink = btn.previousSibling;
    const id = closestLink.getAttribute('data-id');
    state.readedPostsIds.push(id);
    state.readedPostsIds = Array.from(new Set(state.readedPostsIds));
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

const checkUpdates = (delay, links, state, watchedState) => {
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

        addEventForPosts(state, watchedState);
      });
      setTimeout(
        checkUpdates,
        delay,
        delay,
        state.feeds.map((feed) => feed.url),
        state,
        watchedState,
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
    readedPostsIds: [],
    modalWindowId: '',
  };

  const delay = 5000;
  const watchedState = watch(state);

  startAppInterface()
    .then(() => {
      checkUpdates(delay, state.feeds.map((feed) => feed.url), state, watchedState);
      const rssForm = document.querySelector('form');
      rssForm.addEventListener('submit', (e) => {
        e.preventDefault();
        watchedState.addRssProcessState = 'processing';
        const url = rssForm.elements.url.value;
        const schema = createSchema(state);
        schema.validate({ url })
          .then((result) => {
            watchedState.validForm = 'valid';
            const fullUrl = createUrl(result.url);
            axios.get(fullUrl)
              .then((response) => {
                const { posts, feed } = parser(response.data.contents);
                feed.url = result.url;

                const idFeed = _.uniqueId();

                feed.idFeed = idFeed;
                const postWithIds = addIdForPosts(posts, idFeed);

                watchedState.posts = [...state.posts, ...postWithIds];
                watchedState.feeds.push(feed);

                addEventForPosts(state, watchedState);

                watchedState.addRssProcessState = 'success';
              })
              .catch((error) => {
                watchedState.addRssProcessState = 'failed';
                if (error.message === 'Network Error') {
                  watchedState.errorApp = i18nextInstance.t('errors.network');
                } else if (error.message === 'unableToParse') {
                  watchedState.errorApp = i18nextInstance.t('errors.valid');
                } else {
                  watchedState.errorApp = i18nextInstance.t('errors.mistake');
                }
              });
          })
          .catch((error) => {
            watchedState.addRssProcessState = 'failed';
            const [nameErr] = error.errors;
            watchedState.validForm = 'invalid';
            watchedState.errorApp = nameErr;
          });
      });
    });
};
