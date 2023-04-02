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
  } else if (path === 'rssForm.valid') {
    err.classList.remove('text-danger');
    err.classList.add('text-success');
    err.textContent = 'RSS успешно загружен';

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
  } else if (path === 'feeds') {
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
      document.querySelector('.ulFeeds').append(liFeed);
    });
  } else if (path === 'posts') {
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
      console.log(liPost);
      liPost.append(link);
      liPost.append(btnPost);
      document.querySelector('.ulPosts').append(liPost);
    });
  }
};
