import {httpClient} from '~/utils/api';
import {setItemDisplayData} from '~/utils/helpers';

export const state = () => {
    return {
        detailOverlay: {items: [], display: false, currentIndex: -1},
        fullItemImage: '',
        toast: {display: false}
    };
};

export const getters = {
    detailOverlay: (state) => {
        return state.detailOverlay;
    },
    fullItemImage: (state) => {
        return state.fullItemImage;
    },
    toast: (state) => {
        return state.toast;
    }
};

export const actions = {
    displayDetailOverlay: async ({commit}, item) => {
        const detailId = (item.isTrack ? item.album.id : item.id);
        const response = await httpClient.post('/detail', {itemDetailId: detailId, isTrack: item.isTrack, isAlbum: item.isAlbum, isArtist: item.isArtist});
        commit('setItemDetailData', {item, data: response.data});
        commit('displayDetailOverlay', item);
    },
    displayArtistDetail: async ({dispatch}, artist) =>{
        const response = await httpClient.post('/artist', {itemId: artist.id});
        artist.images = response.data.artist.images;
        artist.genres = response.data.artist.genres;
        
        setItemDisplayData(artist);
        dispatch('displayDetailOverlay', artist);
    }
};

export const mutations = {
    displayDetailOverlay(state, item){
        state.detailOverlay.currentIndex++;
        state.detailOverlay.items = [...state.detailOverlay.items, item];
        state.detailOverlay.display = true;
    },
    closeDetailOverlay(state){
        state.detailOverlay = {items: [], display: false, currentIndex: -1}
    },
    goBackDetailOverlay(state){
        state.detailOverlay.items.splice(state.detailOverlay.currentIndex, 1);
        state.detailOverlay.currentIndex--;
    },
    displayFullItemImage(state, imageUrl){
        state.fullItemImage = imageUrl;
    },
    closeFullItemImage(state){
        state.fullItemImage = '';
    },
    setItemDetailData(state, payload){
        payload.item.details = payload.data;
    },
    setToast(state, toast){
        //{display: boolean, text: string}
        state.toast = toast;
    }
};