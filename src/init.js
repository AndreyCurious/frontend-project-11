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
  feedsState: [],
  postsState: [],
  watchedPosts: false,
  watchedFeeds: false,
  readState: [],
  readWatched: [],
  readNow: '',
};
let uniqIdFeeds = 0;
let uniqIdPosts = 0;
const watchedState = onChange(state, render);

const checkUpdates = (links) => {
  uniqIdPosts = 0; //id переназначаем на каждом обновлении
  uniqIdFeeds = 0;
  state.postsState = []; //обнуляем оба массива
  state.watchedPosts = [];
  links.forEach((link) => { //собираем все посты в один массив state.postsState
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
          state.postsState.push({
            idFeed: uniqIdFeeds, idPost: uniqIdPosts, title: item.querySelector('title').textContent, link: item.querySelector('link').nextSibling.textContent, description: item.querySelector('description').textContent,
          });
        });
      })
      .then(() => {
        if (links[links.length - 1] === link) {
          watchedState.watchedPosts = state.postsState; //отправляем массв на отрисовку
          watchedState.readWatched = []; // обнуляем прочитанные посты 

          const postsBtn = document.querySelectorAll('li>.btn');
          postsBtn.forEach((item) => {
            item.addEventListener('click', () => {
              const id = item.getAttribute('data-id');
              const readPost = state.watchedPosts.filter((post) => post.idPost === Number(id));
              watchedState.readNow = readPost;
              state.readNow = [];
              state.readState.push(readPost[0]);
            });
          });
          watchedState.readWatched = state.readState; // отрисовывем заново прочитанные посты по массиву id по аналогии с постами 
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
          url = url.toString();
          axios.get(url)
            .then((response) => { // пушим все фиды в отдельный массив
              const responseDom = parser(response);
              uniqIdFeeds += 1;
              state.feedsState.push({ id: uniqIdFeeds, title: responseDom.querySelector('title').textContent, description: responseDom.querySelector('description').textContent });
              const posts = responseDom.querySelectorAll('item');
              posts.forEach((item) => { // пушим все посты в отдельный массив
                uniqIdPosts += 1;
                state.postsState.push({
                  idFeed: uniqIdFeeds, idPost: uniqIdPosts, title: item.querySelector('title').textContent, link: item.querySelector('link').nextSibling.textContent, description: item.querySelector('description').textContent,
                });
              });
              watchedState.rssForm.valid = 'valid'; // на этом этапе отрисовывем заготовку для списков постов и фидов

              if (state.rssForm.links.indexOf(result.url) === -1) {
                state.rssForm.links.push(result.url);
              }
              watchedState.rssForm.url = result.url; // удалили урл из строки ввода и навели фокус
              watchedState.rssForm.url = 'loadSuccess'; //отрисовали что rss успешно загружен
              state.watchedPosts = []; // обнулили посты
              state.watchedFeeds = []; // обнулили фиды
              watchedState.watchedPosts = state.postsState; // закидываем на отрисовку массив постов
              watchedState.watchedFeeds = state.feedsState; // закидываем на отрисовку массив фидов
            })
            .then(() => {
              //после отрисовки вешаем обработчик на каждую кнопку просмотра постов
              const postsBtn = document.querySelectorAll('li>.btn');
              postsBtn.forEach((item) => {
                item.addEventListener('click', () => {
                  const id = item.getAttribute('data-id');
                  const readPost = state.watchedPosts.filter((post) => post.idPost === Number(id));
                  watchedState.readNow = readPost;
                  state.readNow = [];
                  state.readState.push(readPost[0]);
                });
              });
              if (state.checkUpdates === 'no') { // запускаем обновление
                state.checkUpdates = 'yes';
                checkUpdates(state.rssForm.links);
              }
            })
            .catch((err) => {
              // не знал как реализовать разные ошибки, придумал только такой вариант 
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
