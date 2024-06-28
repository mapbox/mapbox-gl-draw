export function getAccessToken() {
  const accessToken =
    process.env.MapboxAccessToken ||
    process.env.MAPBOX_ACCESS_TOKEN ||
    (new URLSearchParams(location.search).get('access_token')) ||
    localStorage.getItem('accessToken');

  localStorage.setItem('accessToken', accessToken);
  return accessToken;
}
