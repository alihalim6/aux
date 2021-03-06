//https://github.com/nuxt/nuxt.js/blob/dev/examples/with-sockets/io/index.js
import http from 'http';
import socketIO from 'socket.io';

export default function(){
  this.nuxt.hook('render:before', () => {
    const server = http.createServer(this.nuxt.renderer.app);
    const io = socketIO(server);

    // overwrite nuxt.server.listen()
    this.nuxt.server.listen = (port, host) => new Promise(resolve => server.listen(port || 3000, host || 'localhost', resolve));
    // close this server on 'close' event
    this.nuxt.hook('close', () => new Promise(server.close));

    // Add socket.io events
    io.on('connection', (socket) => {
      socket.on('goingLive', function(id){
        socket.broadcast.emit('liveSession', id);
      });
    });
  });
}