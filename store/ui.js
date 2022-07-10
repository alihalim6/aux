import {httpClient} from '~/utils/api';
import {setItemMetaData} from '~/utils/helpers';

export const state = () => {
  return {
    detailsOverlay: {items: [], display: false, currentIndex: -1},
    fullItemImage: '',
    toast: {display: false},
    loading: true
  };
};

export const getters = {
  detailsOverlay: (state) => {
    return state.detailsOverlay;
  },
  fullItemImage: (state) => {
    return state.fullItemImage;
  },
  toast: (state) => {
    return state.toast;
  },
  isLoading: (state) => {
    return state.loading;
  }
};

export const actions = {
  displayDetailsOverlay: async ({commit}, item) => {
    const detailsId = (item.isTrack ? item.album.id : item.id);

    const response = await httpClient.post('/details', {
      itemDetailsId: detailsId, 
      isTrack: item.isTrack, 
      isAlbum: item.isAlbum, 
      isArtist: item.isArtist,
      isPlaylist: item.isPlaylist,
      singleArtistId: item.singleArtistId
    });

    commit('setItemDetailsData', {item, data: response.data});
    commit('displayDetailsOverlay', item);
  },
  displayArtistDetails: async ({dispatch}, artist) => {
    const response = await httpClient.post('/artist', {itemId: artist.id});
    
    //use new object to avoid vuex issues when mutating passed in artist directly
    const artistToDisplay = {
      ...artist,
      images: response.data.artist.images,
      genres: response.data.artist.genres
    };
    
    setItemMetaData([artistToDisplay]);
    dispatch('displayDetailsOverlay', artistToDisplay);
  }
};

export const mutations = {
  displayDetailsOverlay(state, item){
    state.detailsOverlay.currentIndex++;
    state.detailsOverlay.items = [...state.detailsOverlay.items, item];
    state.detailsOverlay.display = true;
  },
  closeDetailsOverlay(state){
    state.detailsOverlay = {items: [], display: false, currentIndex: -1}
  },
  goBackDetailsOverlay(state){
    state.detailsOverlay.items.splice(state.detailsOverlay.currentIndex, 1);
    state.detailsOverlay.currentIndex--;
  },
  displayFullItemImage(state, imageUrl){
    state.fullItemImage = imageUrl;
  },
  closeFullItemImage(state){
    state.fullItemImage = '';
  },
  setItemDetailsData(state, payload){
    payload.item.details = payload.data;
  },
  setToast(state, toast){
    //{display: boolean, text: string}
    state.toast = toast;
  },
  setLoading(state, loading){
    state.loading = loading;
  }
};