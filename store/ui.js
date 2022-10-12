import {httpClient} from '~/utils/api';
import {setItemMetaData} from '~/utils/helpers';
import {v4 as uuid} from 'uuid';

export const state = () => {
  return {
    detailOverlays: {items: [], display: false, currentIndex: -1},
    fullItemImage: '',
    toast: {},
    loading: true,
    feed: {display: false},
    feedAlert: {}
  };
};

export const getters = {
  detailOverlays: (state) => {
    return state.detailOverlays;
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
  feed: (state) => {
    return state.feed;
  },
  feedAlert: (state) => {
    return state.feedAlert;
  }
};

export const actions = {
  displayDetailOverlays: async ({commit}, item) => {
    const detailsId = (item.isTrack ? item.album.id : item.id);

    const { data } = await httpClient.post('/details', {
      itemDetailsId: detailsId, 
      isTrack: item.isTrack, 
      isAlbum: item.isAlbum, 
      isArtist: item.isArtist,
      isPlaylist: item.isPlaylist,
      singleArtistId: item.singleArtistId
    });

    commit('displayDetailOverlays', {...item, details: data});
  },
  displayArtistDetails: async ({dispatch}, artist) => {
    const { data } = await httpClient.post('/artist', {itemId: artist.id});
    
    //use new object to avoid vuex issues when mutating passed in artist directly
    const artistToDisplay = {
      ...artist,
      images: data.artist.images,
      genres: data.artist.genres
    };
    
    dispatch('displayDetailOverlays', setItemMetaData([artistToDisplay])[0]);
  }
};

export const mutations = {
  displayDetailOverlays(state, item){
    state.detailOverlays.currentIndex++;
    state.detailOverlays.items = [...state.detailOverlays.items, {...item, overlayId: uuid()}];
    state.detailOverlays.display = true;
    state.feed.display = false;
  },
  closeDetailOverlays(state){
    state.detailOverlays = {items: [], display: false, currentIndex: -1}
  },
  goBackDetailOverlays(state){
    state.detailOverlays.items.splice(state.detailOverlays.currentIndex, 1);
    state.detailOverlays.currentIndex--;
  },
  displayFullItemImage(state, imageUrl){
    state.fullItemImage = imageUrl;
  },
  closeFullItemImage(state){
    state.fullItemImage = '';
  },
  updateOverlayItem(state, updatedItem){
    state.detailOverlays.items.splice(state.detailOverlays.currentIndex, 1, updatedItem);
  },
  setToast(state, toast){
    state.toast = toast;
  },
  setLoading(state, loading){
    state.loading = loading;
  },
  displayFeed(state){
    state.feed.display = true;
    state.detailOverlays.display = false;
  },
  closeFeed(state){
    state.feed.display = false;
    state.detailOverlays.display = !!state.detailOverlays.items.length;//display overlay if one is there
  },
  setFeedAlert(state, alert){
    state.feedAlert = alert;
  },
};