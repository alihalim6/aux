import socket from '~/plugins/socket.client.js';
import {FEED, USER, UI} from '~/store/constants';
import {ignoredUsers} from '~/utils/helpers';
import {SPLASH} from '~/utils/constants';

function isNotSplash(){
  return window.location.href.indexOf(SPLASH) == -1;
}

function initSocketClient(){
  socket.on('handleLiveUser', userProfile => {
    if(isNotSplash()) $nuxt.$store.dispatch(`${FEED}/handleLiveUser`, userProfile);
  });

  socket.on('handleActivity', activity => {
    if(isNotSplash()) $nuxt.$store.dispatch(`${FEED}/handleActivity`, activity);
  });

  socket.on('handleUserDisconnect', () => {
    if(isNotSplash()) $nuxt.$store.dispatch(`${FEED}/handleUserDisconnect`);
  });

  socket.on('handleActivityReactionAdded', reaction => {
    if(isNotSplash()) $nuxt.$store.dispatch(`${FEED}/handleActivityReaction`, reaction);
  });

  socket.on('handleUserFollowed', ({followedById, followedByName, followedId}) => {
    if(isNotSplash() && ($nuxt.$store.getters[`${USER}/profile`].id == followedId) && !ignoredUsers().find(userId => userId == followedById)){
      $nuxt.$store.commit(`${UI}/setToast`, {text: `${followedByName} just followed you on Spotify!`});
    }
  });
}

export default initSocketClient;