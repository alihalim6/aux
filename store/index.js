import axios from 'axios';
import {DATA} from '~/utils/constants';

export const state = () => {
    return {
        accessToken: '',
        discover: {
            data: {},
            lastDataFetch: 0
        }
    };
};

export const getters = {
    accessToken: (state) => {
        return state.accessToken;
    },
    dataFetchNeeded: (state) => (category) => {
        return !state[category].lastDataFetch || ((state[category].lastDataFetch + DATA.REFRESH_TIME) < Date.now());
    },
    data: (state) => (category) => {
        return state[category].data;
    }
};

export const actions = {
    fetchDiscoverData({commit, getters}, params){
        if(getters.dataFetchNeeded('discover')){
            return new Promise((resolve) => {
                axios.get('http://localhost:3000/v1/discover', {headers: {'access-token':  params.accessToken}}).then(response => {
                    commit('saveData', {category: 'discover', response});
                    commit('setLastDataFetch', 'discover');
                    resolve(response);
                }, () => {
                    resolve({});
                });
            });
        }
        else{
            return Promise.resolve(getters.data('discover'));
        }
    }
};

export const mutations = {
    saveAccessToken(state, token){
        state.accessToken = token;
    },
    setLastDataFetch(state, category){
      state[category].lastDataFetch = Date.now();
    },
    saveData(state, payload){
        state[payload.category].data = payload.response.data;
    }
};