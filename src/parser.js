export default (response) => new DOMParser().parseFromString(response.data.contents, 'text/html');
