import i18next from 'i18next';
import ru from './locales/ru';

export const i18nextInstance = i18next.createInstance();
export const startView = () => i18nextInstance.init({
  lng: 'ru',
  debug: true,
  resources: {
    ru,
  },
});

const inputForm = document.querySelector('#url-input');
const err = document.querySelector('.feedback');

const valid = (value) => {
  if (value === 'valid') {
    inputForm.classList.remove('is-invalid');
  } else {
    inputForm.classList.add('is-invalid');
  }
};

const status = (stateForm) => {
  if (stateForm === 'processing') {
    err.classList.remove('text-danger');
    err.textContent = '';
    document.querySelector('[type="submit"]').disabled = true;
  } else if (stateForm === 'failed') {
    err.classList.add('text-danger');
    err.classList.remove('text-success');
    document.querySelector('[type="submit"]').disabled = false;
  } else if (stateForm === 'expectation') {
    document.querySelector('.full-article').textContent = i18nextInstance.t('readFull');
    document.querySelector('.btn-secondary').textContent = i18nextInstance.t('close');
    document.querySelector('[for="url-input"]').textContent = i18nextInstance.t('link');
    document.querySelector('h1').textContent = i18nextInstance.t('rss');
    document.querySelector('.lead').textContent = i18nextInstance.t('title');
    document.querySelector('.mt-2').textContent = i18nextInstance.t('example');
    document.querySelector('#created').textContent = i18nextInstance.t('created');
    document.querySelector('.footer>div>div>a').textContent = i18nextInstance.t('me');
    document.querySelector('[type="submit"]').textContent = i18nextInstance.t('add');
  } else if (stateForm === 'success') {
    err.classList.remove('text-danger');
    err.classList.add('text-success');
    document.querySelector('[type="submit"]').disabled = false;
    err.textContent = i18nextInstance.t('rssLoad');
    inputForm.focus();
    inputForm.value = '';
  }
};

const viewFeeds = (feeds) => {
  const feedsHtml = document.querySelector('.feeds');
  feedsHtml.textContent = '';
  const cardFeeds = document.createElement('div');
  cardFeeds.classList.add('card', 'border-0');
  const cardBodyFeeds = document.createElement('div');
  cardBodyFeeds.classList.add('card-body');
  const h2Feeds = document.createElement('h2');
  h2Feeds.classList.add('card-title', 'h4');
  cardBodyFeeds.append(h2Feeds);
  cardFeeds.append(cardBodyFeeds);
  feedsHtml.append(cardFeeds);
  h2Feeds.textContent = i18nextInstance.t('feeds');

  const ulFeeds = document.createElement('ul');
  ulFeeds.classList.add('list-group', 'border-0', 'rounded-0', 'ulFeeds');

  cardFeeds.append(ulFeeds);

  const fragmentFeeds = new DocumentFragment();
  document.querySelector('.ulFeeds').textContent = '';
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
    fragmentFeeds.append(liFeed);
  });
  ulFeeds.append(fragmentFeeds);
};

const viewPosts = (posts) => {
  const postsHtml = document.querySelector('.posts');
  postsHtml.textContent = '';
  const cardPosts = document.createElement('div');
  cardPosts.classList.add('card', 'border-0');
  const cardBodyPosts = document.createElement('div');
  cardBodyPosts.classList.add('card-body');
  const h2Posts = document.createElement('h2');
  h2Posts.classList.add('card-title', 'h4');
  cardBodyPosts.append(h2Posts);
  cardPosts.append(cardBodyPosts);
  postsHtml.append(cardPosts);
  h2Posts.textContent = i18nextInstance.t('posts');

  const ulPosts = document.createElement('ul');
  ulPosts.classList.add('list-group', 'border-0', 'rounded-0', 'ulPosts');

  cardPosts.append(ulPosts);

  const fragmentPosts = new DocumentFragment();
  document.querySelector('.ulPosts').textContent = '';
  posts.all.forEach((item) => {
    const liPost = document.createElement('li');
    liPost.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');
    const link = document.createElement('a');
    link.setAttribute('data-id', item.idPost);

    if (posts.readed.indexOf(item.idPost) === -1) {
      link.classList.add('fw-bold');
    } else {
      link.classList.add('fw-normal', 'link-secondary');
    }

    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
    link.setAttribute('href', item.link);
    link.textContent = item.title;

    const btnPost = document.createElement('button');
    btnPost.classList.add('btn', 'btn-outline-primary', 'btn-sm');
    btnPost.setAttribute('data-bs-toggle', 'modal');
    btnPost.setAttribute('data-bs-target', '#modal');
    btnPost.setAttribute('data-id', item.idPost);
    btnPost.textContent = i18nextInstance.t('view');

    liPost.append(link);
    liPost.append(btnPost);
    fragmentPosts.append(liPost);
  });
  ulPosts.append(fragmentPosts);
};

const modalWindow = (post) => {
  document.querySelector(`[href="${post.link.trim()}"]`).classList.remove('fw-bold');
  document.querySelector(`[href="${post.link}"]`).classList.add('fw-normal', 'link-secondary');

  document.querySelector('.modal-title').textContent = post.title;
  document.querySelector('.modal-body').textContent = post.description;
  const readFull = document.querySelector('.full-article');
  readFull.setAttribute('href', post.link);
};

const errShow = (valueErr) => {
  err.textContent = valueErr;
};

export const render = (path, value) => {
  const mapping = {
    validForm: (valueValid) => valid(valueValid),
    err: (valueErr) => errShow(valueErr),
    stateForm: (valueState) => status(valueState),
    posts: (valuePosts) => viewPosts(valuePosts),
    feeds: (valueFeeds) => viewFeeds(valueFeeds),
    modalWindow: (valueModal) => modalWindow(valueModal),

  };
  mapping[path](value);
};
