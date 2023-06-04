import i18next from 'i18next';
import onChange from 'on-change';
import resources from './locales';

export const i18nextInstance = i18next.createInstance();
export const startAppInterface = () => i18nextInstance.init({
  lng: 'ru',
  debug: true,
  resources,
}).then(() => {
  document.querySelector('.full-article').textContent = i18nextInstance.t('readFull');
  document.querySelector('.btn-secondary').textContent = i18nextInstance.t('close');
  document.querySelector('[for="url-input"]').textContent = i18nextInstance.t('link');
  document.querySelector('h1').textContent = i18nextInstance.t('rss');
  document.querySelector('.lead').textContent = i18nextInstance.t('title');
  document.querySelector('.mt-2').textContent = i18nextInstance.t('example');
  document.querySelector('#created').textContent = i18nextInstance.t('created');
  document.querySelector('.footer>div>div>a').textContent = i18nextInstance.t('me');
  document.querySelector('[type="submit"]').textContent = i18nextInstance.t('add');
});

const setValidClass = (value) => {
  const inputForm = document.querySelector('#url-input');
  if (value === 'valid') {
    inputForm.classList.remove('is-invalid');
  } else {
    inputForm.classList.add('is-invalid');
  }
};

const changePage = (addRssProcessState) => {
  const err = document.querySelector('.feedback');
  const inputForm = document.querySelector('#url-input');
  if (addRssProcessState === 'processing') {
    err.classList.remove('text-danger');
    err.textContent = '';
    document.querySelector('[type="submit"]').disabled = true;
  } else if (addRssProcessState === 'failed') {
    err.classList.add('text-danger');
    err.classList.remove('text-success');
    document.querySelector('[type="submit"]').disabled = false;
  } else if (addRssProcessState === 'success') {
    err.classList.remove('text-danger');
    err.classList.add('text-success');
    document.querySelector('[type="submit"]').disabled = false;
    err.textContent = i18nextInstance.t('rssLoad');
    inputForm.focus();
    inputForm.value = '';
  }
};

const drawsFeeds = (feeds) => {
  const feedsHtml = document.querySelector('.feeds');

  const cardFeeds = document.createElement('div');
  cardFeeds.classList.add('card', 'border-0');
  const cardBodyFeeds = document.createElement('div');
  cardBodyFeeds.classList.add('card-body');
  const h2Feeds = document.createElement('h2');
  h2Feeds.classList.add('card-title', 'h4');
  cardBodyFeeds.append(h2Feeds);
  cardFeeds.append(cardBodyFeeds);
  h2Feeds.textContent = i18nextInstance.t('feeds');

  const ulFeeds = document.createElement('ul');
  ulFeeds.classList.add('list-group', 'border-0', 'rounded-0', 'ulFeeds');

  feeds.forEach((item) => {
    const liFeed = document.createElement('li');
    liFeed.classList.add('list-group-item', 'border-0', 'border-end-0');

    const h3 = document.createElement('h3');
    h3.classList.add('h6', 'm-0');
    h3.textContent = item.title;

    const p = document.createElement('p');
    p.classList.add('m-0', 'small', 'text-black-50');
    p.textContent = item.description;

    liFeed.append(h3, p);
    ulFeeds.append(liFeed);
  });

  cardFeeds.append(ulFeeds);
  feedsHtml.replaceChildren(cardFeeds);
};

const drawsPosts = (posts, state) => {
  if (state.feeds.length === 0) {
    const postsHtml = document.querySelector('.posts');

    const cardPosts = document.createElement('div');
    cardPosts.classList.add('card', 'border-0');
    const cardBodyPosts = document.createElement('div');
    cardBodyPosts.classList.add('card-body');
    const h2Posts = document.createElement('h2');
    h2Posts.classList.add('card-title', 'h4');
    cardBodyPosts.append(h2Posts);
    cardPosts.append(cardBodyPosts);
    h2Posts.textContent = i18nextInstance.t('posts');

    const ulPosts = document.createElement('ul');
    ulPosts.classList.add('list-group', 'border-0', 'rounded-0', 'ulPosts');

    cardPosts.append(ulPosts);
    postsHtml.append(cardPosts);
  }

  const fragment = new DocumentFragment();

  posts.forEach((item) => {
    const liPost = document.createElement('li');
    liPost.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');
    const link = document.createElement('a');
    link.setAttribute('data-id', item.id);

    if (state.readedPostsIds.has(item.id)) {
      link.classList.add('fw-normal', 'link-secondary');
    } else {
      link.classList.add('fw-bold');
    }

    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
    link.setAttribute('href', item.link);
    link.textContent = item.title;

    const btnPost = document.createElement('button');
    btnPost.classList.add('btn', 'btn-outline-primary', 'btn-sm');
    btnPost.setAttribute('data-bs-toggle', 'modal');
    btnPost.setAttribute('data-bs-target', '#modal');
    btnPost.setAttribute('data-id', item.id);
    btnPost.textContent = i18nextInstance.t('view');

    liPost.append(link);
    liPost.append(btnPost);
    fragment.append(liPost);
  });
  document.querySelector('.ulPosts').replaceChildren(fragment);
};

const openModalWindow = (id, state) => {
  const openedPost = state.posts.find((post) => post.id === id);

  document.querySelector(`[href="${openedPost.link.trim()}"]`).classList.remove('fw-bold');
  document.querySelector(`[href="${openedPost.link}"]`).classList.add('fw-normal', 'link-secondary');

  document.querySelector('.modal-title').textContent = openedPost.title;
  document.querySelector('.modal-body').textContent = openedPost.description;
  const readFull = document.querySelector('.full-article');
  readFull.setAttribute('href', openedPost.link);
};

const showError = (valueErr) => {
  const err = document.querySelector('.feedback');
  err.textContent = valueErr;
};

export const watch = (state) => onChange(state, (path, value) => {
  const mapping = {
    validForm: (valueValid) => setValidClass(valueValid),
    errorApp: (valueErr) => showError(valueErr),
    addRssProcessState: (valueState) => changePage(valueState),
    posts: (valuePosts, stateApp) => drawsPosts(valuePosts, stateApp),
    feeds: (valueFeeds) => drawsFeeds(valueFeeds),
    modalWindowId: (valueModal, stateApp) => openModalWindow(valueModal, stateApp),
  };
  mapping[path](value, state);
});
