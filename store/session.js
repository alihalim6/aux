import {USER} from './constants';
import moment from 'moment';

export const state = () => {
  return {
    activity: []
  };
};

export const getters = {
  auxSessionFeed: (state) => {
    return state.activity;
  }
};

export const actions = {
  addToActivityFeed: ({commit, rootGetters}, params) => {
    commit('addToActivityFeed', {
      user: rootGetters[`${USER}/profile`], 
      track: params.track,
      wentLive: params.wentLive,
      timestamp: moment().toISOString()
    });
  }
};

export const mutations = {
  addToActivityFeed(state, activity){
    state.activity.unshift(activity);
  }
};