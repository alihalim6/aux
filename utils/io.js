//import socket from '~/plugins/socket.client.js';
import {FEED} from '../store/constants';

function io(){
  socket.on('handleLiveUser', userProfile => {
    $nuxt.$store.dispatch(`${FEED}/handleLiveUser`, userProfile);
  });

  socket.on('handleActivity', activity => {
    $nuxt.$store.dispatch(`${FEED}/handleActivity`, activity);
  });

  socket.on('handleUserDisconnect', () => {
    $nuxt.$store.dispatch(`${FEED}/handleUserDisconnect`);
  });

  socket.on('handleActivityReactionAdded', reaction => {
    $nuxt.$store.dispatch(`${FEED}/handleActivityReaction`, reaction);
  });
}

export default io;