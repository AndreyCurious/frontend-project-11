import * as yup from 'yup';
import axios from 'axios';
import _ from 'lodash';
import { watch, startView, i18nextInstance } from './view.js';
import parser from './parser.js';

const delay = 5000;

const state = {
  validForm: '',
  err: '',

  stateForm: 'filling',

  posts: [],
  feeds: [],
  readedPostsIds: [],
  modalWindow: '',
};
export const watchedState = watch(state);

const addId = (posts, id) => posts.map((post) => {
  const copyPost = { ...post };
  copyPost.idFeed = id;
  copyPost.idPost = _.uniqueId();
  return copyPost;
});

const createUrl = (link) => {
  const checkSlash = (item) => (item.endsWith('/') ? item.slice(0, -1) : item);
  let url = new URL('https://allorigins.hexlet.app/get');
  url.searchParams.set('disableCache', 'true');
  url.searchParams.set('url', checkSlash(link));
  url = url.toString();
  if (url[url.length - 1] === 'F') {
    return url.slice(0, -3);
  }
  return url;
};

const addBtnForPosts = () => {
  const postsBtns = document.querySelectorAll('li>.btn');
  postsBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const closestLink = btn.previousSibling;
      const id = closestLink.getAttribute('data-id');
      state.readedPostsIds.push(id);
      watchedState.modalWindow = id;
    });
  });
};

const checkUpdates = (links) => {
  const promisesOfResponses = links.map((url) => axios.get(createUrl(url)));
  Promise.all(promisesOfResponses)
    .then((responses) => {
      responses.forEach((response) => {
        const { posts } = parser(response);
        const newTitles = [];
        posts.forEach((post) => newTitles.push(post.title));
        const newPosts = [];
        const { id } = state.feeds
          .filter((feed) => feed.url === response.data.status.url)[0];
        state.posts.forEach((oldPost) => {
          if (newTitles.indexOf(oldPost.title) === -1) {
            posts.forEach((newPost) => {
              if (newPost.title === oldPost.title) {
                newPosts.push(newPost);
              }
            });
          }
        });
        const postWithIds = addId(newPosts, id);
        watchedState.posts = [...state.posts, ...postWithIds];

        addBtnForPosts();
      });
      setTimeout(checkUpdates, delay, state.feeds.map((feed) => feed.url));
    }).catch((err) => console.log(err));
};

export default () => {
  startView()
    .then(() => {
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
                const { posts, feed } = parser(response, result.url);
                const idFeed = _.uniqueId();

                feed.idFeed = idFeed;
                const postWithIds = addId(posts, idFeed);

                watchedState.posts = [...state.posts, ...postWithIds];
                watchedState.feeds.push(feed);

                addBtnForPosts();

                watchedState.stateForm = 'success';
              })
              .catch((err) => {
                watchedState.stateForm = 'failed';
                if (err.message === 'Network Error') {
                  watchedState.err = i18nextInstance.t('errors.network');
                } else if (err.message === 'unableToParse') {
                  watchedState.err = i18nextInstance.t('errors.unableToParse');
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
