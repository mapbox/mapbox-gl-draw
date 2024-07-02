export function getAccessToken() {
  const accessToken =
    import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ||
    (new URLSearchParams(location.search).get('access_token')) ||
    localStorage.getItem('accessToken');

  localStorage.setItem('accessToken', accessToken);
  return accessToken;
}
