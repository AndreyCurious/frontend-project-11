import onChange from 'on-change';
import * as yup from 'yup';
import axios from 'axios';
import _ from 'lodash';
import { render, startView, i18nextInstance } from './view.js';
import parser from './parser.js';

const delay = 5000;

const state = {
  rssForm: {
    valid: '',
    url: '',
    err: '',
  },
  responses: [],
  checkUpdates: 'no',
  feedsState: [],
  postsState: [],
  watchedPosts: false,
  watchedFeeds: false,
  readState: [],
  readWatched: [],
  readNow: '',
  btnDisabled: false,
};
const watchedState = onChange(state, render);

const createUrl = (link) => {
  let url = new URL('https://allorigins.hexlet.app/get');
  url.searchParams.set('disableCache', 'true');
  url.searchParams.set('url', link);
  url = url.toString();
  return url;
};

const pushPost = (newPost, idFeed) => {
  state.postsState.push({
    idFeed, idPost: _.uniqueId(), title: newPost.querySelector('title').textContent, link: newPost.querySelector('link').nextSibling.textContent.trim(), description: newPost.querySelector('description').textContent,
  });
};

const handlerWatchBtn = () => {
  const postsBtns = document.querySelectorAll('li>.btn');
  postsBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const closestLink = btn.previousSibling;
      const link = closestLink.getAttribute('href');
      const readPost = state.watchedPosts.filter((post) => post.link === link);
      watchedState.readNow = readPost;
      state.readNow = [];
      state.readState.push(readPost[0]);
    });
  });
};

const checkUpdates = (links) => {
  state.responses = [];
  links.forEach((link) => {
    const url = createUrl(link);
    state.responses.push(axios.get(url));
  });
  Promise.all(state.responses)
    .then((responses) => {
      responses.forEach((response) => {
        const responseDom = parser(response);
        const oldTitles = [];
        document.querySelectorAll('li>a').forEach((link) => oldTitles.push(link.textContent));
        const newTitles = [];
        responseDom.querySelectorAll('item>title').forEach((title) => newTitles.push(title.textContent));
        const { id } = state.watchedFeeds
          .filter((feed) => feed.url === response.data.status.url)[0];
        newTitles.forEach((newTitle) => {
          if (oldTitles.indexOf(newTitle) === -1) {
            responseDom.querySelector('item').forEach((post) => {
              if (post.querySelector('title').textContent === newTitle) {
                pushPost(post, id);
              }
            });
          }
        });
      });
    })
    .then(() => {
      state.watchedPosts = [];
      watchedState.watchedPosts = state.postsState;
    })
    .then(() => {
      handlerWatchBtn();
      watchedState.readWatched = [];
      watchedState.readWatched = state.readState;
    })
    .then(() => {
      setTimeout(checkUpdates, delay, links);
    })
    .catch((err) => {
      console.log(err);
    });
};

startView()
  .then(() => {
    const form = document.querySelector('form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      watchedState.btnDisabled = true; // выключаем кнопку добавить
      const schema = yup.object().shape({
        url: yup.string().url(i18nextInstance.t('errors.url')).notOneOf(state.feedsState.map((feed) => feed.url), i18nextInstance.t('errors.notOneOf')).required(),
      });
      schema.validate({ url: form.elements.url.value })
        .then((result) => {
          const url = createUrl(result.url);
          axios.get(url)
            .then((response) => { // пушим все фиды в отдельный массив
              const responseDom = parser(response);
              const idFeed = _.uniqueId();
              state.feedsState.push({
                id: idFeed, title: responseDom.querySelector('title').textContent, description: responseDom.querySelector('description').textContent, url: result.url,
              });
              const posts = responseDom.querySelectorAll('item');
              posts.forEach((post) => { // пушим все посты в отдельный массив
                pushPost(post, idFeed);
              });
              watchedState.rssForm.valid = 'valid'; // на этом этапе отрисовывем заготовку для списков постов и фидов
              watchedState.rssForm.url = result.url; // удалили урл из строки ввода и навели фокус
              watchedState.rssForm.url = 'loadSuccess'; // отрисовали что rss успешно загружен
              state.watchedPosts = []; // обнулили посты
              state.watchedFeeds = []; // обнулили фиды
              watchedState.watchedPosts = state.postsState; // закидываем на отрисовку массив постов
              watchedState.watchedFeeds = state.feedsState; // закидываем на отрисовку массив фидов
            })
            .then(() => {
              watchedState.btnDisabled = false; // включаем кнопку "добавить" обратно
            })
            .then(() => {
              // после отрисовки вешаем обработчик на каждую кнопку просмотра постов
              handlerWatchBtn();
              if (state.checkUpdates === 'no') { // запускаем обновление
                state.checkUpdates = 'yes';
                checkUpdates(state.feedsState.map((feed) => feed.url));
              }
            })
            .catch((err) => {
              // не знал как реализовать разные ошибки, придумал только такой вариант
              if (err.message === 'Network Error') {
                watchedState.rssForm.err = i18nextInstance.t('errors.network');
              } else {
                watchedState.rssForm.err = i18nextInstance.t('errors.valid');
              }
              watchedState.btnDisabled = false;
            });
        })
        .catch((error) => {
          const [nameErr] = error.errors;
          watchedState.rssForm.err = nameErr;
          watchedState.btnDisabled = false;
        });
    });
  });
