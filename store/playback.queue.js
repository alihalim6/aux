import {SPOTIFY, UI} from './constants';
import {SPOTIFY_GREEN} from '~/utils/constants';
import {shuffleArray} from '~/utils/helpers';
import {isSameTrack} from '~/utils/helpers';

export const state = () => {
  return {
    queue: []
  };
};

//doNotRestartQueue: track ends or 'next' pressed, so just move within queue without restarting it;
//otherwise if user clicks play on an item ('jumps'), queue set clean (started) from that item on forward

function playTrackWithinQueue(params){
  const queue = params.getters.queue;

  params.dispatch(`${SPOTIFY}/togglePlayback`, {
    item: queue[params.index], 
    itemSet: queue, 
    doNotRestartQueue: true
  }, {root: true});
}

export const getters = {
  queue: (state) => {
    return state.queue;
  },
  currentlyPlayingIndex(state, getters, rootState, rootGetters){
    const currentlyPlayingUri = rootGetters[`${SPOTIFY}/currentlyPlayingItemUri`];
    const index = getters.queue.findIndex(track => track.uri == currentlyPlayingUri);
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

const threeDotToast = {
  backgroundColor: SPOTIFY_GREEN,
  timeout: 2500
};

export const actions = {  
  startPlaybackQueue: ({commit, getters, dispatch}, params) => {
    commit('startQueue', params);
  },
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
    commit(`${UI}/setToast`, {...threeDotToast, text: `Track${tracks.length > 1 ? 's' : ''} added to end of queue`}, {root: true});
  },
  setTracksToPlayNext: ({commit, getters}, params) => {
    commit('setPlayNext', {currentIndex: getters.currentlyPlayingIndex, tracks: params.tracks});

    if(!params.noConfirmationToast){
      commit(`${UI}/setToast`, {...threeDotToast, text: `Track${params.tracks.length > 1 ? 's' : ''} set to play next`}, {root: true});
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

export const mutations = {
  startQueue(state, params){
    state.queue = [...params.itemSet.slice(params.index)];
  },
  clearQueue(state){
    state.queue = [];
  },  
  removeFromQueue(state, track){
    const trackIndex = state.queue.findIndex(queueTrack => queueTrack.uuid === track.uuid);
    state.queue.splice(trackIndex, 1);
  },
  setPlayNext(state, params){
    state.queue.splice(params.currentIndex + 1, 0, ...params.tracks);
  },
  clearUpNext(state, currentIndex){
    state.queue = state.queue.slice(0, currentIndex + 1);
  },
  addToEndOfQueue(state, tracks){
    state.queue.push(...tracks);
  },
  shuffleUpNext(state, params){
    state.queue.splice(...[params.currentIndex + 1, params.nextTracks.length].concat(shuffleArray(params.nextTracks)));
  }
};