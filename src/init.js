import onChange from 'on-change';
import * as yup from 'yup';
import axios from 'axios';
import _ from 'lodash';
import { render, startView, i18nextInstance } from './view.js';
import parser from './parser.js';

const delay = 5000;

const state = {
  rssForm: {
    valid: 'invalid',
    url: '',
    err: '',
  },
  posts: [],
  feeds: [],
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
  if (url[url.length - 1] === 'F') {
    return url.slice(0, -3);
  }
  return url;
};

const pushPost = (newPost, idFeed, postArr) => {
  postArr.push({
    idFeed, idPost: _.uniqueId(), title: newPost.querySelector('title').textContent, link: newPost.querySelector('link').nextSibling.textContent.trim(), description: newPost.querySelector('description').textContent,
  });
  return postArr;
};

const handlerWatchBtn = () => {
  const postsBtns = document.querySelectorAll('li>.btn');
  postsBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const closestLink = btn.previousSibling;
      const link = closestLink.getAttribute('href');
      const readPost = state.posts.filter((post) => post.link === link);
      watchedState.readNow = readPost;
      state.readNow = [];
      state.readState.push(readPost[0]);
    });
  });
};

const checkUpdates = (links) => {
  const responsesPromises = links.map((link) => axios.get(createUrl(link)));
  Promise.all(responsesPromises)
    .then((responses) => {
      const postsArr = [];
      responses.forEach((response) => {
        const responseDom = parser(response);
        const oldTitles = [];
        document.querySelectorAll('li>a').forEach((link) => oldTitles.push(link.textContent));
        const newTitles = [];
        responseDom.querySelectorAll('item>title').forEach((title) => newTitles.push(title.textContent));
        const id = state.feeds
          .filter((feed) => feed.url === response.data.status.url)[0];
        newTitles.forEach((newTitle) => {
          if (oldTitles.indexOf(newTitle) === -1) {
            responseDom.querySelector('item').forEach((post) => {
              if (post.querySelector('title').textContent === newTitle) {
                pushPost(post, id, postsArr);
              }
            });
          }
        });
      });
      const result = [...postsArr, ...state.posts];
      watchedState.posts = result;

      handlerWatchBtn();

      state.readWatched = [];
      watchedState.readWatched = state.readState;

      setTimeout(checkUpdates, delay, links);
    })
    .catch((err) => {
      console.log(err);
    });
};

export default () => {
  startView()
    .then(() => {
      checkUpdates(state.feeds.map((feed) => feed.url));
      const form = document.querySelector('form');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        watchedState.btnDisabled = true; // выключаем кнопку добавить
        const url = createUrl(form.elements.url.value);
        const schema = yup.object().shape({
          url: yup.string().url(i18nextInstance.t('errors.url')).notOneOf(state.feeds.map((feed) => feed.url), i18nextInstance.t('errors.notOneOf')).required(),
        });
        schema.validate({ url })
          .then((result) => {
            axios.get(result.url)
              .then((response) => { // пушим все фиды в отдельный массив
                const responseDom = parser(response);
                const idFeed = _.uniqueId();
                const feedsArr = [];
                feedsArr.push({
                  id: idFeed, title: responseDom.querySelector('title').textContent, description: responseDom.querySelector('description').textContent, url: result.url,
                });
                const posts = responseDom.querySelectorAll('item');
                const postArr = [];
                posts.forEach((post) => { // пушим все посты в отдельный массив
                  pushPost(post, idFeed, postArr);
                });

                watchedState.rssForm.valid = 'valid'; // на этом этапе отрисовывем заготовку для списков постов и фидов
                watchedState.rssForm.url = result.url; // удалили урл из строки ввода и навели фокус
                watchedState.rssForm.url = 'loadSuccess'; // отрисовали что rss успешно загружен
                state.posts = []; // обнулили посты
                state.feeds = []; // обнулили фиды
                watchedState.posts = postArr; // закидываем на отрисовку массив постов
                watchedState.feeds = feedsArr; // закидываем на отрисовку массив фидов

                watchedState.btnDisabled = false; // включаем кнопку "добавить" обратно

                handlerWatchBtn();
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
};
