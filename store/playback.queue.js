export const state = () => {
  return {
    queue: [],
    currentlyPlayingIndex: 0
  };
};

export const getters = {
  queue: (state) => {
    return state.queue;
  },
  currentlyPlayingIndex: (state) => {
    return state.currentlyPlayingIndex;
  },
  hasPreviousItem: (state) => {
    return state.currentlyPlayingIndex >= 1;
  },
  hasNextItem: (state) => {
    return state.currentlyPlayingIndex < (state.queue.length - 1);
  }
};

export const actions = {  
  handlePlaybackQueue: ({commit}, params) => {
    commit('setCurrentlyPlayingIndex', params.index);
    commit('setQueue', params.items);
  },
  playPreviousItem: ({dispatch, getters}) => {
    const queue = getters.queue;
    const currentlyPlayingIndex = getters.currentlyPlayingIndex;
    dispatch('spotify/togglePlayback', {item: queue[currentlyPlayingIndex - 1], itemSet: queue}, {root: true});
  },
  playNextItem: ({dispatch, getters}) => {
    const queue = getters.queue;
    const currentlyPlayingIndex = getters.currentlyPlayingIndex;
    dispatch('spotify/togglePlayback', {item: queue[currentlyPlayingIndex + 1], itemSet: queue}, {root: true});
  },
  clearQueue: ({commit}) => {
    commit('setQueue', []);
    commit('setCurrentlyPlayingIndex', 0);
  }
};

export const mutations = {
  setQueue(state, queue){
    state.queue = queue;
  },
  setCurrentlyPlayingIndex(state, index){
    state.currentlyPlayingIndex = index;
  }
};