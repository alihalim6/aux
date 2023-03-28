export const state = () => {
  return {
    toast: {},
    loading: true,
    feed: {display: false, unseenActivity: false},
    feedAlert: {},
    replyingToFeedReaction: false
  };
};

export const getters = {
  toast: (state) => {
    return state.toast;
  },
  isLoading: (state) => {
    return state.loading;
  },
  feed: (state) => {
    return state.feed;
  },
  feedAlert: (state) => {
    return state.feedAlert;
  },
  replyingToFeedReaction: (state) => {
    return state.replyingToFeedReaction;
  }
};

export const mutations = {
  setToast(state, toast){
    state.toast = toast;
  },
  setLoading(state, loading){
    state.loading = loading;
  },
  displayFeed(state){
    state.feed.display = true;
    state.feed.unseenActivity = false;
  },
  closeFeed(state){
    state.feed.display = false;
  },
  setFeedAlert(state, alert){
    if(!state.replyingToFeedReaction){
      state.feedAlert = alert;
    }
  },
  toggleReplyingToFeedReaction(state){
    state.replyingToFeedReaction = !state.replyingToFeedReaction;
  },
  unseenActivity(state, unseen){
    state.feed.unseenActivity = unseen;
  }
};