import {openWebSocket} from '/util.mjs';
import {spotify, getOAuthToken} from '/spotify.mjs';

const playButton = document.querySelector('#play');
const pauseButton = document.querySelector('#pause');
const currentButton = document.querySelector('#current');

async function main() {
  const socket = await openWebSocket(`${location.host}/websocket`, (event) => {
    console.log(event.data)
  });

  const node = await deviceSelect((deviceId) => {
    socket.send(JSON.stringify({
      action: 'register',
      token: getOAuthToken(),
      deviceId,
    }));
  });
  document.body.appendChild(node);

  playButton.onclick = () => {
    socket.send(JSON.stringify({action: 'play', id: 'spotify:track:3VjpBGWAWkrrxz6yqSkUms'}));
  };

  pauseButton.onclick = async () => {
    socket.send(JSON.stringify({action: 'pause'}));
  };
  currentButton.onclick = async () => {
    socket.send(JSON.stringify({action: 'current'}));
  };
}

async function deviceSelect(cb) {
  const {devices} = await spotify('v1/me/player/devices');
  console.log(devices)
  if (!devices || devices.length === 0) {
    return Object.assign(document.createElement('p'), {innerText: 'no active devices. open spotify and try again'});
  }
  devices.sort(({type: a}, {type: b}) => b > a); // smartphone before computer
  const select = document.createElement('select');
  select.size = devices.length;
  select.innerHTML = devices.map(({id, name, type}) => `<option value=${id}>${name} (${type})</option>`).join('');
  select.onchange = (e) => cb(e.explicitOriginalTarget.value);
  cb(devices[0].id);
  return select;
}

main();
