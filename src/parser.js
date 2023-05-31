export default (content) => {
  const responseDom = new DOMParser().parseFromString(content, 'text/xml');
  const errorNode = responseDom.querySelector('parsererror');
  if (errorNode) {
    const e = new Error();
    e.name = errorNode.textContent;
    e.message = 'unableToParse';
    throw e;
  }
  const titleFeed = responseDom.querySelector('title').textContent;
  const descriptionFeed = responseDom.querySelector('description').textContent;
  const feed = {
    title: titleFeed,
    description: descriptionFeed,
  };

  const responsePosts = Array.from(responseDom.querySelectorAll('item'));
  const posts = responsePosts.map((responsePost) => {
    const titlePost = responsePost.querySelector('title').textContent;
    const linkPost = responsePost.querySelector('link').textContent;
    const descriptionPost = responsePost.querySelector('description').textContent;
    return {
      title: titlePost,
      link: linkPost,
      description: descriptionPost,
    };
  });
  return { posts, feed };
};
