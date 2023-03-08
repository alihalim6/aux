import {SPOTIFY, UI} from './constants';
import {shuffleArray} from '~/utils/helpers';
import {isSameTrack} from '~/utils/helpers';
import {v4 as uuid} from 'uuid';

export const state = () => {
  return {
    queue: []
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

export const getters = {
  queue: (state) => {
    return state.queue;
  },
  currentlyPlayingIndex(state, getters, rootState, rootGetters){
    const currentlyPlayingItem = rootGetters[`${SPOTIFY}/currentlyPlayingItem`];
    const index = getters.queue.findIndex(track => track.feedId == currentlyPlayingItem.feedId);
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

export const actions = {  
  playPreviousTrack: ({dispatch, getters}) => {
    playTrackWithinQueue({
      getters,
      dispatch,
      index: getters.currentlyPlayingIndex - 1
    });
  },
  playNextTrack: ({dispatch, getters}) => {
    playTrackWithinQueue({
      getters,
      dispatch,
      index: getters.currentlyPlayingIndex + 1
    });
  },
  clearUpNext: ({getters, commit}) => {
    commit('clearUpNext', getters.currentlyPlayingIndex);
  },
  addToEndOfQueue: ({commit}, tracks) => {
    commit('addToEndOfQueue', tracks);
    commit(`${UI}/setToast`, {timeout: THREE_DOT_TOAST_TIMEOUT, text: `Track${tracks.length > 1 ? 's' : ''} added to end of queue`}, {root: true});
  },
  setTracksToPlayNext: ({commit, getters}, params) => {
    commit('setPlayNext', {currentIndex: getters.currentlyPlayingIndex, tracks: params.tracks});

    if(!params.noConfirmationToast){
      commit(`${UI}/setToast`, {timeout: THREE_DOT_TOAST_TIMEOUT, text: `Track${params.tracks.length > 1 ? 's' : ''} set to play next`}, {root: true});
    }
  },
  shuffleUpNext: ({commit, getters}) => {
    commit('shuffleUpNext', {nextTracks: getters.nextTracks, currentIndex: getters.currentlyPlayingIndex});
  },
  playTrackNow: ({dispatch, getters, commit}, track) => {
    if(getters.nextTrack && isSameTrack(track, getters.nextTrack)){
      commit('removeFromQueue', getters.nextTrack);
    }

    dispatch('setTracksToPlayNext', {tracks: [track], noConfirmationToast: true});
    dispatch('playNextTrack');
  }
};

//feedId: extra unique id in case same track is played more than once in a queue;
//for this store, it's at the track level (since that is what the queue works with)
//but for the feed store, it's at the metadata level (for a little but of ease/cleanliness)
function setFeedIds(tracks){
  return tracks.map(track => ({...track, feedId: uuid()}));
}

export const mutations = {
  startQueue(state, params){
    //tie first item in new queue to currentlyPlayingItem in spotify store with given feedId; rest of items get own id
    const newQueue = params.itemSet.slice(params.index);
    newQueue[0].feedId = params.feedId;
    state.queue = [newQueue[0], ...setFeedIds(newQueue.slice(1))];
  },
  clearQueue(state){
    state.queue = [];
  },  
  removeFromQueue(state, track){
    const trackIndex = state.queue.findIndex(queueTrack => queueTrack.feedId === track.feedId);
    state.queue.splice(trackIndex, 1);
  },
  setPlayNext(state, params){
    state.queue.splice(params.currentIndex + 1, 0, ...setFeedIds(params.tracks));
  },
  clearUpNext(state, currentIndex){
    state.queue = state.queue.slice(0, currentIndex + 1);
  },
  addToEndOfQueue(state, tracks){
    state.queue.push(...setFeedIds(tracks));
  },
  shuffleUpNext(state, params){
    state.queue.splice(...[params.currentIndex + 1, params.nextTracks.length].concat(shuffleArray(params.nextTracks)));
  }
};