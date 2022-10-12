import {USER, UI, PLAYBACK_QUEUE} from './constants';
import moment from 'moment';
import socket from '~/plugins/socket.client.js';
import {AUX_MODE, SPOTIFY_GREEN} from '~/utils/constants';
import {storageGetBoolean} from '~/utils/storage';
import {isSameTrack} from '~/utils/helpers';

export const state = () => {
  return {
    feed: [],
    users: []
  };
};

export const getters = {
  feed: (state) => {
    return state.feed;
  },
  users: (state) => {
    return state.users;
  }
};

export const actions = {
  //activity from current user
  addToFeed: ({commit, rootGetters, getters, dispatch}, params) => {
    const activity = {
      user: rootGetters[`${USER}/profile`],
      track: {...params.track, originalListener: rootGetters[`${USER}/profile`].id},
      timestamp: moment().toISOString()
    };

    const trackAlreadyInFeed = getters.feed.find(activity => isSameTrack(activity.track, params.track));

    if(trackAlreadyInFeed){
      let repeatingOwnTrack = false;

      //if listening to my own track again, NOOP
      if(trackAlreadyInFeed.track.originalListener == rootGetters[`${USER}/profile`].id){
        repeatingOwnTrack = true;
      }

      dispatch('addReactionToActivity', {activity: trackAlreadyInFeed, message: `${repeatingOwnTrack ? '' : 'also'} listening ${repeatingOwnTrack ? 'again' : ''}`});
    }
    else{
      commit('addToFeed', {...activity, addedByCurrentUser: true});
    }

    socket.emit('activityAdded', activity);
  },

  //activity from another user
  handleActivity: ({commit, getters, rootGetters, dispatch}, activity) => {
    const trackAlreadyInFeed = getters.feed.find(feedActivity => isSameTrack(feedActivity.track, activity.track));

    if(trackAlreadyInFeed){
      return;
    }

    commit('addToFeed', activity);

    if(!rootGetters[`${UI}/feed`].display){//only show toast if not already viewing feed
      commit(`${UI}/setFeedAlert`, {
        trackAddedToFeed: true,
        img: activity.track.imgUrl.small,
        track: activity.track,
        addedByImg: activity.user.img, 
        addedByName: activity.user.name
      }, {root: true});
    }

    if(rootGetters[`${PLAYBACK_QUEUE}/queue`].length && storageGetBoolean(AUX_MODE)){
      dispatch(`${PLAYBACK_QUEUE}/setTracksToPlayNext`, {tracks: [activity.track], noConfirmationToast: true}, {root: true});
    }
  },

  handleLiveUser: ({commit, getters, rootGetters}, userProfile) => {
    const userAlreadyAddedIndex = getters.users.findIndex(user => user.id == userProfile.id);
    const userAlreadyAdded = userAlreadyAddedIndex > -1;

    //ignore current user's live status and other users already in array
    if(userProfile.id == rootGetters[`${USER}/profile`].id || userAlreadyAdded){
      if(userAlreadyAdded){
        commit('updateUserBeacon', {index: userAlreadyAddedIndex, profile: userProfile});
      }

      return;
    }

    commit('addUser', {...userProfile, lastBeacon: Date.now()});
    commit(`${UI}/setToast`, {img: userProfile.img, username: userProfile.name, text: 'is on', backgroundColor: SPOTIFY_GREEN}, {root: true});
  },
  handleUserDisconnect:  ({commit, rootGetters}) => {
    //all users clear out list and re-signal self
    commit('clearUsers');
    socket.emit('userLive', rootGetters[`${USER}/profile`]);//TODO: would need 3+ users to test since user that disconnected is not there to receive this
  },

  //reaction from current user
  addReactionToActivity: ({commit, rootGetters}, reaction) => {
   commit('addReactionToActivity', {activity: reaction.activity, author: {name: 'You'}, message: reaction.message});
   socket.emit('activityReactionAdded', {...reaction, author: rootGetters[`${USER}/profile`]});
  },

  //reaction from another user
  handleActivityReaction: ({commit}, reaction) => {
    commit(`${UI}/setFeedAlert`, {
      activityReaction: true,
      img: reaction.author.img, 
      track: reaction.activity.track,
      username: `${reaction.author.name}:`,
      text: reaction.message, 
    }, {root: true});

    commit('addReactionToActivity', reaction);
  }
};

export const mutations = {
  addToFeed(state, activity){
    state.feed.unshift(activity);
  },
  addUser(state, user){
    state.users.push(user);
  },
  updateUserBeacon(state, params){
    params.profile.lastBeacon = Date.now();
    state.users.splice(params.index, 1, params.profile);
  },
  removeUser(state, userIndex){
    state.users.splice(userIndex, 1);
  },
  clearUsers(state){
    state.users = [];
  },
  addReactionToActivity(state, reaction){
    const activity = state.feed.find(activity => activity.timestamp == reaction.activity.timestamp);

    if(activity){
      if(!activity.reactions){
        activity.reactions = [];
      }

      activity.reactions = [{author: reaction.author.name, message: reaction.message, timestamp: new Date(moment())}, ...activity.reactions];
    }
  }
};