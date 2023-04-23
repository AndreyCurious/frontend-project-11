import i18next from 'i18next';
import ru from './locales/ru';

export const i18nextInstance = i18next.createInstance();
export const startView = () => i18nextInstance.init({
  lng: 'ru',
  debug: true,
  resources: {
    ru,
  },
})
  .then(() => {
    // сначала отрисовка всех слов на начальном экране
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

export const render = (path, value) => {
  const inputForm = document.querySelector('#url-input');
  const err = document.querySelector('.feedback');
  if (path === 'rssForm.err') {
    err.classList.remove('text-success');
    err.classList.add('text-danger');
    inputForm.classList.add('is-invalid');
    err.textContent = value;
  } else if (path === 'rssForm.url') {
    inputForm.value = '';
    inputForm.focus();
    inputForm.classList.remove('is-invalid');
    if (value === 'loadSuccess') {
      err.classList.remove('text-danger');
      err.classList.add('text-success');
      err.textContent = i18nextInstance.t('rssLoad');
    }
  } else if (path === 'rssForm.valid') {
    const feeds = document.querySelector('.feeds');
    const cardFeeds = document.createElement('div');
    cardFeeds.classList.add('card', 'border-0');
    const cardBodyFeeds = document.createElement('div');
    cardBodyFeeds.classList.add('card-body');
    const h2Feeds = document.createElement('h2');
    h2Feeds.classList.add('card-title', 'h4');
    cardBodyFeeds.append(h2Feeds);
    cardFeeds.append(cardBodyFeeds);
    feeds.append(cardFeeds);
    h2Feeds.textContent = i18nextInstance.t('feeds');

    const posts = document.querySelector('.posts');
    const cardPosts = document.createElement('div');
    cardPosts.classList.add('card', 'border-0');
    const cardBodyPosts = document.createElement('div');
    cardBodyPosts.classList.add('card-body');
    const h2Posts = document.createElement('h2');
    h2Posts.classList.add('card-title', 'h4');
    cardBodyPosts.append(h2Posts);
    cardPosts.append(cardBodyPosts);
    posts.append(cardPosts);
    h2Posts.textContent = i18nextInstance.t('posts');

    const ulFeeds = document.createElement('ul');
    ulFeeds.classList.add('list-group', 'border-0', 'rounded-0', 'ulFeeds');
    const ulPosts = document.createElement('ul');
    ulPosts.classList.add('list-group', 'border-0', 'rounded-0', 'ulPosts');
    cardFeeds.append(ulFeeds);
    cardPosts.append(ulPosts);
  } else if (path === 'watchedFeeds') {
    const fragmentFeeds = new DocumentFragment();
    document.querySelector('.ulFeeds').textContent = '';
    value.forEach((item) => {
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
    document.querySelector('.ulFeeds').append(fragmentFeeds);
  } else if (path === 'watchedPosts') {
    const fragmentPosts = new DocumentFragment();
    document.querySelector('.ulPosts').textContent = '';
    value.forEach((item) => {
      const liPost = document.createElement('li');
      liPost.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');
      const link = document.createElement('a');
      link.setAttribute('data-id', item.idPost);
      link.classList.add('fw-bold');
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
    document.querySelector('.ulPosts').append(fragmentPosts);
  } else if (path === 'readWatched') {
    value.forEach((item) => {
      document.querySelector(`[data-id="${item.idPost}"]`).classList.remove('fw-bold');
      document.querySelector(`[data-id="${item.idPost}"]`).classList.add('fw-normal', 'link-secondary');
    });
  } else if (path === 'readNow') {
    document.querySelector(`[href="${value[0].link.trim()}"]`).classList.remove('fw-bold');
    document.querySelector(`[href="${value[0].link}"]`).classList.add('fw-normal', 'link-secondary');
    document.querySelector('.modal-title').textContent = value[0].title;
    document.querySelector('.modal-body').textContent = value[0].description;
    const readFull = document.querySelector('.full-article');
    readFull.setAttribute('href', value[0].link);
  } else if (path === 'btnDisabled') {
    if (value === true) {
      document.querySelector('[type="submit"]').disabled = true;
    } else {
      document.querySelector('[type="submit"]').disabled = false;
    }
  }
};
