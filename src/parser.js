export default (response) => {
    return new DOMParser().parseFromString(response.data.contents, 'text/html')
};