import {SPOTIFY, UI} from './constants';
import {shuffleArray, isSameTrack} from '~/utils/helpers';
import {v4 as uuid} from 'uuid';
import cloneDeep from 'lodash.clonedeep';
import spotify from '~/api/spotify';
import {storageGet} from '~/utils/storage';
import {DEVICE_ID} from '~/utils/constants';

export const state = () => {
  return {
    queue: [],
    restOfQueue: []
  };
};

//playingTrackWithinExistingQueue: track ends or 'next' pressed, so just move within queue without restarting it;
//otherwise if user clicks play on an item ('jumps'), queue set clean (started) from that item on forward

function playTrackWithinQueue({dispatch, getters, index, ...rest}){
  dispatch(`${SPOTIFY}/togglePlayback`, {
    item: getters.queue[index], 
    itemSet: getters.queue, 
    playingTrackWithinExistingQueue: true,
    ...rest
  }, {root: true});
}

const QUEUE_LENGTH_LIMIT = 51;

export const getters = {
  queue: (state) => {
    return state.queue;
  },
  restOfQueue: (state) => {
    return state.restOfQueue;
  },
  restOfQueueLength: (state) => {
    return state.restOfQueue.length;
  },
  currentlyPlayingIndex(state, getters, rootState, rootGetters){
    const currentlyPlayingItem = rootGetters[`${SPOTIFY}/currentlyPlayingItem`];
    const index = getters.queue.findIndex(track => track.queueId == currentlyPlayingItem.queueId);
    return index;
  },
  hasPreviousTrack: (state, getters) => {
    return getters.currentlyPlayingIndex >= 1;
  },
  hasNextTrack: (state, getters) => {
    return getters.currentlyPlayingIndex < (state.queue.length - 1);
  },
  nextTrack: (state, getters) => {
    return state.queue[getters.currentlyPlayingIndex + 1];
  },
  nextTracks: (state, getters) => {
    return state.queue.slice(getters.currentlyPlayingIndex + 1);
  },
  //tracks after the next track
  thenTracks: (state, getters) => {
    return state.queue.slice(getters.currentlyPlayingIndex + 2);
  }
};

const THREE_DOT_TOAST_TIMEOUT = 2500;

function updateSpotifyNextTrack(track){
  if(track && track.uri.indexOf('track') > -1){
    //console.log(`next track modified, resetting queue on spotify side with it...${track.name}`);
    spotify({url: `/me/player/queue?uri=${track.uri}&device_id=${storageGet(DEVICE_ID)}`, method: 'POST'});
  }
}

export const actions = {  
  playPreviousTrack: ({dispatch, getters}) => {
    playTrackWithinQueue({
      getters,
      dispatch,
      index: getters.currentlyPlayingIndex - 1
    });
  },
  playNextTrack: ({dispatch, getters}, params) => {
    playTrackWithinQueue({
      getters,
      dispatch,
      index: getters.currentlyPlayingIndex + 1,
      playingNextTrack: true,
      ...params
    });
  },
  clearUpNext: ({getters, commit}) => {
    commit('clearUpNext', getters.currentlyPlayingIndex);
  },
  addToEndOfQueue: ({commit}, tracks) => {
    commit('addToEndOfQueue', tracks);
    commit(`${UI}/setToast`, {timeout: THREE_DOT_TOAST_TIMEOUT, text: `Track${tracks.length > 1 ? 's' : ''} added to end of queue`}, {root: true});
  },
  setTracksToPlayNext: ({commit, getters}, {tracks, noConfirmationToast, doNotUpdateSpotify}) => {
    commit('setPlayNext', {currentIndex: getters.currentlyPlayingIndex, tracks});

    if(!noConfirmationToast){
      commit(`${UI}/setToast`, {timeout: THREE_DOT_TOAST_TIMEOUT, text: `Track${tracks.length > 1 ? 's' : ''} set to play next`}, {root: true});
    }

    if(!doNotUpdateSpotify){
      updateSpotifyNextTrack(getters.nextTrack);
    }
  },
  shuffleUpNext: ({commit, getters}) => {
    commit('shuffleUpNext', {nextTracks: getters.nextTracks, currentIndex: getters.currentlyPlayingIndex});
  },
  playTrackNow: ({dispatch, getters, commit}, track) => {
    let playingNextTrackNow = false;

    if(getters.nextTrack && isSameTrack(track, getters.nextTrack)){
      commit('removeFromQueue', getters.nextTrack);
      playingNextTrackNow = true;
    }

    dispatch('setTracksToPlayNext', {tracks: [track], noConfirmationToast: true, doNotUpdateSpotify: true});
    dispatch('playNextTrack', {playingNextTrackNow});
  },
  checkForEndOfQueue: ({getters, commit}) => {
    //if about to play last track in main queue and there are tracks in rest of queue, add from latter to former;
    //checking then tracks instead of next tracks because at this point, if the condition is true, we'd be moving from 2nd to last
    //to last track in main queue, which is when we need to take action
    if(!getters.thenTracks.length && getters.restOfQueue.length){
      commit('addFromRestOfQueueToMain');
    }
  },
  removeFromQueue: ({commit,getters}, track) => {
    const nextTrackRemoved = getters.nextTrack.queueId == track.queueId;
    commit('removeFromQueue', track);

    if(nextTrackRemoved){
      updateSpotifyNextTrack(getters.nextTrack);
    }
  }
};

//queueId: extra unique id in case same track is in queue more than once;
//for this store, it's at the track level (since that is what the queue works with)
//but for the feed store, it's at the metadata level (for a little but of ease/cleanliness)
function setQueueIds(tracks){
  //clone tracks that already have feed ids (already been in queue) so that object ref is fresh
  tracks = tracks.map(track => track.queueId ? cloneDeep(track) : track);

  for(let track of tracks){
    track.queueId = uuid();
  }

  return tracks;
}

export const mutations = {
  startQueue(state, params){
    let newQueue = params.queue.slice(params.index);

    //tie first item in new queue to currentlyPlayingItem in spotify store with given queueId; rest of items get own id
    newQueue[0].queueId = params.queueId;
    newQueue = [newQueue[0], ...setQueueIds(newQueue.slice(1))];
    //separating these into two different commits didn't help up next show faster
    state.queue = newQueue.slice(0, QUEUE_LENGTH_LIMIT);
    state.restOfQueue = newQueue.slice(QUEUE_LENGTH_LIMIT);
  },
  clearQueue(state){
    state.queue = [];
    state.restOfQueue = [];
  },  
  removeFromQueue(state, track){
    let trackIndex = state.queue.findIndex(queueTrack => queueTrack.queueId === track.queueId);

    if(trackIndex > -1){
      state.queue.splice(trackIndex, 1);
    }
    else{
      trackIndex = state.restOfQueue.findIndex(queueTrack => queueTrack.queueId === track.queueId);
      state.restOfQueue.splice(trackIndex, 1);
    }
  },
  setPlayNext(state, params){
    //not worried about rest of queue here; if set track(s) that puts queue over limit, not a big deal, not likely to be a huge amount;
    //would get messy trying to siphon the added tracks into the main but only up to the limit
    state.queue.splice(params.currentIndex + 1, 0, ...setQueueIds(params.tracks));
  },
  clearUpNext(state, currentIndex){
    state.queue = state.queue.slice(0, currentIndex + 1);
    state.restOfQueue = [];
  },
  addToEndOfQueue(state, tracks){
    if(state.restOfQueue.length){
      state.restOfQueue.push(...setQueueIds(tracks));
    }
    else{
      state.queue.push(...setQueueIds(tracks));
    }
  },
  shuffleUpNext(state, params){
    let shuffledQueue = [...state.queue, ...state.restOfQueue];
    //https://stackoverflow.com/questions/51287428/how-does-the-spread-syntax-affect-array-splice (the simpler syntax gets funky to work with (creates nested array))
    shuffledQueue.splice(...[params.currentIndex + 1, (params.nextTracks.length + state.restOfQueue.length)].concat(shuffleArray([...params.nextTracks, ...state.restOfQueue])));

    if(shuffledQueue.length > QUEUE_LENGTH_LIMIT){
      state.restOfQueue = shuffledQueue.slice(QUEUE_LENGTH_LIMIT);
    }

    state.queue = shuffledQueue.slice(0, QUEUE_LENGTH_LIMIT);
  },
  addFromRestOfQueueToMain(state){
    state.queue.push.apply(state.queue, state.restOfQueue.splice(0, QUEUE_LENGTH_LIMIT));
  }
};