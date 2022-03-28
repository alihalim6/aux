import {DATA} from '~/utils/constants';
import {httpClient} from '~/utils/api';

export const state = () => {
    return {
        newAndRecommended: {
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
    fetchNewAndRecommendedData: async ({commit, getters}) => {
        if(getters.dataFetchNeeded('newAndRecommended')){
            console.log('fetching fresh newAndRecommended data');

            const response = await httpClient.get('/newAndRecommended');

            if(!response.data.error){
                commit('saveData', {category: 'newAndRecommended', response});
                commit('setLastDataFetch', 'newAndRecommended');
            }
        }
        else{
            console.log('using cached newAndRecommended data');
            return Promise.resolve(getters.data('newAndRecommended'));
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