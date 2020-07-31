const playButton = document.querySelector('#play');

async function openWebSocket(hostpath, onmessage) {
  return new Promise((resolve, reject) => {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${hostpath}`);
    socket.onopen = () => resolve(Object.assign(socket, {onmessage}));
    socket.onerror = (err) => reject(err);
  });
}

async function play(url) {
  const context = new AudioContext();
  const buffer = await fetch(url)
        .then(res => res.arrayBuffer())
        .then(arrayBuffer => context.decodeAudioData(arrayBuffer));
  console.log(buffer)
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(context.destination);
  source.start();
}

async function main() {
  const socket = await openWebSocket(`${location.host}/websocket`, (event) => {
    console.log(event.data)
    play('https://s3-us-west-2.amazonaws.com/s.cdpn.io/123941/Yodel_Sound_Effect.mp3');
  });

  playButton.onclick = () => {
    socket.send(JSON.stringify({action: 'play'}));
  };
}

main();
