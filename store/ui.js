export const state = () => {
  return {
    toast: {},
    loading: true,
    feed: {display: false, unseenActivity: false},
    feedAlert: {},
    replyingToFeedReaction: false,
    actionDialog: {},
    darkMode: false
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
  },
  actionDialog: (state) => {
    return state.actionDialog;
  },
  darkMode: (state) => {
    return state.darkMode;
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
  },
  setActionDialog(state, dialog){
    state.actionDialog = dialog;
  },
  setDarkMode(state, darkMode){
    state.darkMode = darkMode;
  },
  toggleDarkMode(state, darkMode){
    state.darkMode = !state.darkMode;
  }
};