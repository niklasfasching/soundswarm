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
