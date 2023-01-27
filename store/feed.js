import {USER, UI, PLAYBACK_QUEUE} from './constants';
import moment from 'moment';
import socket from '~/plugins/socket.client.js';
import {AUX_MODE} from '~/utils/constants';
import {storageGetBoolean} from '~/utils/storage';
import {isSameTrack, ignoredUsers, setDuration, setItemMetaData} from '~/utils/helpers';
import spotify from '~/api/spotify';
import {auxApiClient} from '~/auth';

function findActivityInFeed(feed, newTrack){
  return feed.find(feedActivity => isSameTrack(feedActivity.track, newTrack));
}

export const state = () => {
  return {
    feed: [],
    latestActivity: {},
    users: [
    /* {id: 123456, name: 'music-listener', img: ''}, {id: 12345, name: 'CapitalletteruserLongnameCutmeOff', img: ''}, {id: 1234567, name: 'Word', img: 'https://i.picsum.photos/id/577/200/300.jpg?hmac=iZA0DWSu8zEDIuGdix5l4Jc7RXSJLZ7tR4s25w7Nc8I'},
    {id: 12312313, name: 'asddce asfwwd', img: ''},
    {id: 12312312321, name: 'dadads', img: ''},
    {id: 1212313, name: 'asfad', img: ''},
    {id: 123123124, name: 'asqdq', img: ''},
    {id: 53453, name: 'aad', img: ''},
    {id: 453453, name: 'asdadas_dsaxada', img: ''},
    {id: 3452, name: 'asda alkds la', img: ''},
    {id: 234, name: '1kasn a', img: ''},
    {id: 152422, name: 'lorem aksd ', img: ''},
    {id: 65342, name: 'IE kd qasdas', img: ''},
    {id: 1123131, name: 'OS j da', img: ''},
    {id: 31432, name: '23musix', img: ''},
    {id: 23123414, name: 'jamalCurrt', img: ''},
    {id: 124566543, name: 'asdj d asd', img: ''} */
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
  addToFeed: async ({commit, rootGetters, getters}, params) => {
    const timestamp = moment().toISOString();
    const loggedInUser = rootGetters[`${USER}/profile`];
    await setDuration(params.track);

    const activity = {
      user: loggedInUser,
      track: params.track,
      feedId: params.feedId,
      timestamp,
      updateTimestamp: timestamp //needed to trigger UI updates of feed items immediately
    };

    const activityAlreadyInFeed = findActivityInFeed(getters.feed, params.track);
    let repeatingOwnTrack;

    if(activityAlreadyInFeed){
      repeatingOwnTrack = activityAlreadyInFeed.user.id == loggedInUser.id;
    }
    else{
      commit('addToFeed', {...activity, addedByCurrentUser: true});
    }
  
    commit('updateLatestActivity', {...activity, activityAlreadyInFeed, repeatingOwnTrack});
  },

  //activity from another user
  handleActivity: ({commit, getters, rootGetters, dispatch}, activity) => {
    if(ignoredUsers().find(userId => userId == activity.user.id)){
      return;
    }

    let showAlertAndCheckAuxMode = false;

    const activityAlreadyInFeed = findActivityInFeed(getters.feed, activity.track);
    
    //handle someone else playing a track that you skipped previously
    if(activityAlreadyInFeed && activityAlreadyInFeed.skipped && !activityAlreadyInFeed.played){
      commit('setActivitySkippedOrPlayed', {activity, played: true, updateOriginalTimestamp: true, updateAddedBy: true});
      showAlertAndCheckAuxMode = true;
    }
    else if(!activityAlreadyInFeed){
      commit('addToFeed', activity);
      showAlertAndCheckAuxMode = true;
    }

    if(showAlertAndCheckAuxMode){
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
    }
  },

  handleLiveUser: async ({commit, getters, rootGetters}, userProfile) => {
    const userAlreadyAddedIndex = getters.users.findIndex(user => user.id == userProfile.id);
    const userAlreadyAdded = userAlreadyAddedIndex > -1;
    const loggedInUser = rootGetters[`${USER}/profile`];

    if(!loggedInUser){
      return;
    }

    //ignore current user's live status and other users already in array
    if((userProfile && userProfile.id == loggedInUser.id) || userAlreadyAdded){
      return;
    }

    if(userProfile){
      const data = await spotify({url: `/me/following/contains?ids=${userProfile.id}&type=user`});
      commit('addUser', {...userProfile, following: data[0]});
    }
  },
  handleUserDisconnect:  ({commit, rootGetters}) => {
    //all users clear out list and re-signal self
    commit('clearUsers');
    socket.emit('userLive', rootGetters[`${USER}/profile`]);//TODO: would need 3+ users to test since user that disconnected is not there to receive this
  },

  //reaction from current user
  addReactionToActivity: ({commit, getters, rootGetters}, reaction) => {
    const loggedInUser = rootGetters[`${USER}/profile`];

    commit('addReactionToActivity', {activity: reaction.activity, author: {name: 'You'}, message: reaction.message});
    socket.emit('activityReactionAdded', {...reaction, author: loggedInUser});

    const reactionActivity = findActivityInFeed(getters.feed, reaction.activity.track);
    const timestamp = moment().toISOString();

    auxApiClient().post('/feed/persistReaction', {
      reaction: {
        feedId: reactionActivity.feedId,
        message: reaction.message,
        author: loggedInUser.name,
        timestamp,
        updateTimestamp: timestamp
      }
    });
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
  },
  setActivitySkipped: async ({commit}, activity) => {
    commit('setActivitySkippedOrPlayed', {activity, skipped: true});
  },
  setActivityPlayed: async ({commit}, activity) => {
    commit('setActivitySkippedOrPlayed', {activity, played: true, updateOriginalTimestamp: true});
    
    await auxApiClient().post('/feed/persistActivity', {
      activity: {
        ...activity, 
        track: activity.track.id, 
        trackType: activity.track.type,
        feedId: activity.feedId, 
        played: true
      }
    });
  },
  setInitialFeed: async ({commit}, activities) => {
    const initialFeed = await Promise.all(activities.map(async activity => {
      const track = await spotify({url: `/${activity.trackType}s/${activity.track}`});

      return {
        ...activity,
        track: setItemMetaData([track])[0]
      };
    }));

    commit('setInitialFeed', initialFeed);
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
    const activity = findActivityInFeed(state.feed, reaction.activity.track);

    if(activity){
      const timestamp = moment().toISOString();
      
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
    const activity = findActivityInFeed(state.feed, params.activity.track);

    if(activity){
      activity.updateTimestamp = moment().toISOString();

      if(params.updateOriginalTimestamp){
        activity.timestamp = activity.updateTimestamp;
      }

      //we don't wanna falsify (i.e. if params.played is undefined) an activity that has already been set to played, so only set when not been set before
      if(!activity.played){
        activity.played = params.played;
      }

      activity.skipped = params.skipped;

      if(params.updateAddedBy){
        activity.addedByCurrentUser = false;
        activity.user = params.activity.user;
      }
    }
  },
  setInitialFeed(state, feed){
    state.feed = feed;
  }
};