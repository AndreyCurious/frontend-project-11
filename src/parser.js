export default (response, url) => {
  const responseDom = new DOMParser().parseFromString(response.data.contents, 'text/html');

  try {
    const feed = {
      title: responseDom.querySelector('title').textContent, description: responseDom.querySelector('description').textContent, url,
    };

    const responsePosts = responseDom.querySelectorAll('item');
    const posts = [];
    responsePosts.forEach((responsePost) => {
      posts.push({
        title: responsePost.querySelector('title').textContent, link: responsePost.querySelector('link').nextSibling.textContent.trim(), description: responsePost.querySelector('description').textContent,
      });
    });
    return { posts, feed };
  } catch (e) {
    e.message = 'unableToParse';
    throw e;
  }
};
