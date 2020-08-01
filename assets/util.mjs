export async function openWebSocket(hostpath, onmessage) {
  return new Promise((resolve, reject) => {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${hostpath}`);
    socket.onopen = () => resolve(Object.assign(socket, {onmessage}));
    socket.onerror = (err) => reject(err);
  });
}
