export const state = () => {
  return {
    profile: null
  };
};

export const getters = {
  profile: (state) => {
    return state.profile;
  }
};

export const mutations = {
  setProfile(state, profile){
    state.profile = profile;
  }
};