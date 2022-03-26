import {DATA} from '~/utils/constants';
import {httpClient} from '~/utils/api';

export const state = () => {
    return {
        discover: {
            data: [],
            lastDataFetch: 0
        }
    };
};

export const getters = {
    dataFetchNeeded: (state) => (category) => {
        return !state[category].lastDataFetch || ((state[category].lastDataFetch + DATA.REFRESH_TIME) < Date.now());
    },
    data: (state) => (category) => {
        return state[category].data;
    }
};

export const actions = {
    fetchDiscoverData: async ({commit, getters}) => {
        if(getters.dataFetchNeeded('discover')){
            console.log('fetching fresh discover data');

            const response = await httpClient.get('/discover');

            if(!response.data.error){
                commit('saveData', {category: 'discover', response});
                commit('setLastDataFetch', 'discover');
            }

            //TODO error - put handler in httpClient config interceptor
        }
        else{
            console.log('using cached discover data');
            return Promise.resolve(getters.data('discover'));
        }
    }
};

export const mutations = {
    setLastDataFetch(state, category){
      state[category].lastDataFetch = Date.now();
    },
    saveData(state, payload){
        state[payload.category].data = payload.response.data;
    }
};