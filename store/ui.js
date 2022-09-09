import {httpClient} from '~/utils/api';
import {setItemMetaData} from '~/utils/helpers';

export const state = () => {
  return {
    detailsOverlay: {items: [], display: false, currentIndex: -1},
    fullItemImage: '',
    toast: {display: false},
    loading: true,
    auxSession: {display: false}
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
  },
  auxSession: (state) => {
    return state.auxSession;
  }
};

export const actions = {
  displayDetailsOverlay: async ({commit}, item) => {
    const detailsId = (item.isTrack ? item.album.id : item.id);

    const { data } = await httpClient.post('/details', {
      itemDetailsId: detailsId, 
      isTrack: item.isTrack, 
      isAlbum: item.isAlbum, 
      isArtist: item.isArtist,
      isPlaylist: item.isPlaylist,
      singleArtistId: item.singleArtistId
    });

    commit('displayDetailsOverlay', {...item, details: data});
  },
  displayArtistDetails: async ({dispatch}, artist) => {
    const { data } = await httpClient.post('/artist', {itemId: artist.id});
    
    //use new object to avoid vuex issues when mutating passed in artist directly
    const artistToDisplay = {
      ...artist,
      images: data.artist.images,
      genres: data.artist.genres
    };
    
    dispatch('displayDetailsOverlay', setItemMetaData([artistToDisplay])[0]);
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
  updateOverlayItem(state, updatedItem){
    state.detailsOverlay.items[state.detailsOverlay.currentIndex] = updatedItem;
  },
  setToast(state, toast){
    state.toast = toast;
  },
  setLoading(state, loading){
    state.loading = loading;
  },
  displayAuxSession(state){
    state.auxSession.display = true;
    state.detailsOverlay.display = false;
  },
  closeAuxSession(state){
    state.auxSession.display = false;
    state.detailsOverlay.display = !!state.detailsOverlay.items.length;
  }
};