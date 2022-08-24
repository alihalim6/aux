import {SPOTIFY, SESSION} from './constants';

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
  hasPreviousTrack: (state, getters, rootState, rootGetters) => {
    return getters.currentlyPlayingIndex >= 1;
  },
  hasNextTrack: (state, getters, rootState, rootGetters) => {
    return getters.currentlyPlayingIndex < (state.queue.length - 1);
  },
  nextTrack: (state, getters, rootState, rootGetters) => {
    return state.queue[getters.currentlyPlayingIndex + 1];
  },
  nextTracks: (state, getters, rootState, rootGetters) => {
    return state.queue.slice(getters.currentlyPlayingIndex + 1);
  },
  //tracks after the next track
  thenTracks: (state, getters, rootState, rootGetters) => {
    return state.queue.slice(getters.currentlyPlayingIndex + 2);
  }
};

export const actions = {  
  startPlaybackQueue: ({commit, getters, dispatch}, params) => {
    if(!getters.queue.length){
      dispatch(`${SESSION}/addToActivityFeed`, {track: params.itemSet[params.index], wentLive: true}, {root: true});
    }

    commit('startQueue', params);
  },
  playPreviousTrack: ({dispatch, getters, rootGetters}) => {
    playTrackWithinQueue({
      getters,
      dispatch,
      index: getters.currentlyPlayingIndex - 1
    });
  },
  playNextTrack: ({dispatch, getters, rootGetters}) => {
    playTrackWithinQueue({
      getters,
      dispatch,
      index: getters.currentlyPlayingIndex + 1
    });
  }
};

export const mutations = {
  startQueue(state, params){
    state.queue = [...params.itemSet.slice(params.index)];
  },
  clearQueue(state){
    state.queue = [];
  }
};