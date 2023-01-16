import {USER, UI, PLAYBACK_QUEUE} from './constants';
import moment from 'moment';
import socket from '~/plugins/socket.client.js';
import {AUX_MODE} from '~/utils/constants';
import {storageGetBoolean} from '~/utils/storage';
import {isSameTrack, ignoredUsers} from '~/utils/helpers';
import {httpClient} from '~/utils/api';

export const state = () => {
  return {
    feed: [],
    latestActivity: {},
    users: [
     {id: 123456, name: 'music-listener', img: ''}, {id: 12345, name: 'CapitalletteruserLongnameCutmeOff', img: ''}, {id: 1234567, name: 'Word', img: 'https://i.picsum.photos/id/577/200/300.jpg?hmac=iZA0DWSu8zEDIuGdix5l4Jc7RXSJLZ7tR4s25w7Nc8I'}
    ]//////
  };
};

export const getters = {
  feed: (state) => {
    return state.feed;
  },
  latestActivity: (state) => {
    return state.latestActivity;
  },
  users: (state) => {
    return state.users;
  }
};

export const actions = {
  //activity from current user
  addToFeed: ({commit, rootGetters, getters}, params) => {
    const timestamp = moment().toISOString();

    const activity = {
      user: rootGetters[`${USER}/profile`],
      track: {...params.track, originalListener: rootGetters[`${USER}/profile`].id, feedId: params.feedId},
      timestamp,
      updateTimestamp: timestamp //needed to trigger UI updates of feed items immediately
    };

    const trackAlreadyInFeed = getters.feed.find(activity => isSameTrack(activity.track, params.track));
    let repeatingOwnTrack;

    if(trackAlreadyInFeed){
      repeatingOwnTrack = trackAlreadyInFeed.track.originalListener == rootGetters[`${USER}/profile`].id;
    }
    else{
      commit('addToFeed', {...activity, addedByCurrentUser: true});
    }
  
    commit('updateLatestActivity', {...activity, trackAlreadyInFeed, repeatingOwnTrack});
  },

  //activity from another user
  handleActivity: ({commit, getters, rootGetters, dispatch}, activity) => {
    if(ignoredUsers().find(userId => userId == activity.user.id)){
      return;
    }

    const trackAlreadyInFeed = getters.feed.find(feedActivity => isSameTrack(feedActivity.track, activity.track));

    if(trackAlreadyInFeed){
      return;
    }

    commit('addToFeed', activity);

    commit(`${UI}/setFeedAlert`, {
      trackAddedToFeed: true,
      img: activity.track.imgUrl.small,
      track: activity.track,
      addedByImg: activity.user.img, 
      addedByName: activity.user.name
    }, {root: true});
    
    if(rootGetters[`${PLAYBACK_QUEUE}/queue`].length && storageGetBoolean(AUX_MODE)){
      dispatch(`${PLAYBACK_QUEUE}/setTracksToPlayNext`, {tracks: [activity.track], noConfirmationToast: true}, {root: true});
    }
  },

  handleLiveUser: async ({commit, getters, rootGetters}, userProfile) => {
    const userAlreadyAddedIndex = getters.users.findIndex(user => user.id == userProfile.id);
    const userAlreadyAdded = userAlreadyAddedIndex > -1;

    //ignore current user's live status and other users already in array
    if((userProfile && rootGetters[`${USER}/profile`] && userProfile.id == rootGetters[`${USER}/profile`].id) || userAlreadyAdded){
      return;
    }

    if(userProfile){
      const {data} = await httpClient.post('/passthru', {url: `/me/following/contains?ids=${userProfile.id}&type=user`});
      commit('addUser', {...userProfile, following: data[0]});
      commit(`${UI}/setToast`, {img: userProfile.img, username: userProfile.name, text: 'is on'}, {root: true});
    }
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
  handleActivityReaction: ({commit, rootGetters}, reaction) => {
    commit(`${UI}/setFeedAlert`, {
      activityReaction: true,
      img: reaction.author.img, 
      track: reaction.activity.track,
      username: `${reaction.author.name}:`,
      text: reaction.message, 
      timeout: 7000
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

    //distinctify; rather do this then trying to worry about why the socket sends multiple users at same time plus handleLiveUser() is async
    //so can't reliably check if user is already in array in time
    state.users = [...new Map(state.users.map(user => [user.id, user])).values()];

    state.users = state.users.sort((a, b) => a.name.localeCompare(b.name));
  },
  removeUser(state, userIndex){
    state.users.splice(userIndex, 1);
  },
  clearUsers(state){
    state.users = [];
  },
  addReactionToActivity(state, reaction){
    const activity = state.feed.find(activity => isSameTrack(activity.track, reaction.activity.track));
    const timestamp = moment().toISOString();

    if(activity){
      if(!activity.reactions){
        activity.reactions = [];
      }

      activity.updateTimestamp = timestamp;
      activity.reactions.unshift({author: reaction.author.name, message: reaction.message, timestamp});
    }
  },
  updateLatestActivity(state, activity){
    state.latestActivity = activity;
  },
  setActivitySkippedOrPlayed(state, params){
    const activity = state.feed.find(acitvity => isSameTrack(acitvity.track, params.activity.track));

    if(activity){
      activity.updateTimestamp = moment().toISOString();

      if(params.updateOriginalTimestamp){
        activity.timestamp = moment().toISOString();
      }

      //we don't wanna falsify an activity that has already been set to played
      if(!activity.played){
        activity.played = params.played;
      }

      activity.skipped = params.skipped;
    }
  }
};