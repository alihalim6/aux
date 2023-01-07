import socket from '~/plugins/socket.client.js';
import {FEED, USER, UI} from '~/store/constants';
import {ignoredUsers} from '~/utils/helpers';

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

  socket.on('handleUserFollowed', ({followedById, followedByName, followedId}) => {
    if(($nuxt.$store.getters[`${USER}/profile`].id == followedId) && !ignoredUsers().find(userId => userId == followedById)){
      $nuxt.$store.commit(`${UI}/setToast`, {text: `${followedByName} just followed you on Spotify!`});
    }
  });
}

export default io;