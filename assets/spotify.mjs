/**
- spotify web sdk only works on desktop - so that's out
  https://developer.spotify.com/documentation/web-playback-sdk/
- we can still control users devices using web api. so let's try that
  https://developer.spotify.com/console/
*/

export function spotify(path, params, body) {
  return fetch(`https://api.spotify.com/${path}?${new URLSearchParams(params)}`, {
    method: body ? 'PUT' : 'GET',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getOAuthToken()}`,
    },
  }).then(res => res.status === 200 ? res.json() : res.text());
}

// https://developer.spotify.com/documentation/general/guides/authorization-guide/#implicit-grant-flow
// simple - but expires every hour. good enough for now
// note: embedding as iframe is not possible (forbidden)
export function getOAuthToken(cb) {
  const tokenTTL = 60 * 60 * 1000;
  const {token, timestamp} = JSON.parse(localStorage.getItem('spotify') || '{}');
  if (!token || new Date().getTime() > timestamp + (tokenTTL - 60 * 1000)) {
    const url = new URL('https://accounts.spotify.com/authorize');
    url.searchParams.set('client_id', '7cb9fa07786049c59792c2ae200bd2b4');
    url.searchParams.set('redirect_uri', 'https://localhost.niklasfasching.de');
    url.searchParams.set('scope', ['user-read-playback-state', 'user-modify-playback-state']);
    url.searchParams.set('response_type', 'token');
    window.location = url;
  }
  if (cb) cb(token);
  return token;
}

// handle spotify oauth redirect from getOAuthToken()
if (location.hash) {
  const params = new URLSearchParams(location.hash.slice(1));
  localStorage.setItem('spotify', JSON.stringify({
    token: params.get('access_token'),
    timestamp: new Date().getTime(),
  }));
  history.replaceState(null, null, ' ');
}
