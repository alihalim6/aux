//https://github.com/nuxt/nuxt.js/blob/2ec62617ced873fef97c73a6d7aa1271911ccfd5/examples/with-sockets/io/index.js

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

    io.on('connection', socket => {
      socket.on('userLive', data => {
        if(data){//refresh at same/similar time seems to cause empty data
          socket.broadcast.emit('handleLiveUser', data.userProfile);
        }
      });

      socket.on('activityAdded', activity => {
        socket.broadcast.emit('handleActivity', activity);
      });

      socket.on('activityReactionAdded', reaction => {
        socket.broadcast.emit('handleActivityReactionAdded', reaction);
      });

      socket.on('userFollowed', data => {
        socket.broadcast.emit('handleUserFollowed', data);
      });

      socket.on('disconnect', reason => {
        console.log(reason);
        
        if(reason == 'io server disconnect' || reason == 'io client disconnect'){
          console.log('attempting reconnection...');
          socket.connect();
        }

        io.emit('handleUserDisconnect');
      });
    });
  });
}