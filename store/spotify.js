import {httpClient, handleApiError} from '~/utils/api';
import {refreshToken, accessTokenExpired} from '~/auth';
import {PLAYBACK_QUEUE, FEED, UI, USER} from './constants';
import {shuffleArray} from '~/utils/helpers';
import {v4 as uuid} from 'uuid';

export const state = () => {
  return {
    spotifyDeviceId: '',
    currentlyPlayingItemUri: '',//simple string so that watcher for this doesn't have to be deep on object (performance)
    currentlyPlayingItem: {},
    audioPlaying: false,
    newApiPlayback: ''
  };
};

export const getters = {
  spotifyDeviceId: (state) => {
    return state.spotifyDeviceId;
  },
  currentlyPlayingItemUri: (state) => {
    return state.currentlyPlayingItemUri;
  },
  currentlyPlayingItem: (state) => {
    return state.currentlyPlayingItem;
  },
  audioPlaying: (state) => {
    return state.audioPlaying;
  },
  newApiPlayback: (state) => {
    return state.newApiPlayback;
  }
};

export const actions = {
  playItem: async ({getters, rootGetters}, item) => {
    if(rootGetters[`${USER}/profile`].id == '22xmerkgpsippbpbm4b2ka74y'){//don't take playback from Candace
      console.log('skipping Candace playback api call');
      return;
    }

    try {
    /*   await httpClient.post('/playItem', {
        item, 
        deviceId: getters.spotifyDeviceId
      }); */
    }
    catch(error){
      dispatch('stopPlayback');
      handleApiError('There was an issue with playback lorem ipsum...');
    }
  },
  togglePlayback: async ({commit, getters, dispatch}, params) => {
    try{
      let item = params.item;
      let itemSet = params.itemSet ? params.itemSet.filter(item => !item.isArtist && !item.isCollection) : [];

      //if album or playlist toggled, intercept logic to begin play from its first track instead of whole item (so that we can manage queue via tracks);
      //collections need their details opened in order to be played since tracks available by that time (too messy/duplicative to approach otherwise)
      if(item.isCollection){
        const collectionUri = item.uri;
        console.log(`collection toggled: ${item.name} - ${collectionUri}`);

        if(item.isPlaylist){
          itemSet = item.details.playlistTracks;
        }
        else if(item.isAlbum){
          itemSet = item.details.albumTracks;
        }
        else{
          itemSet = params.itemSet;
        }

        item = itemSet[0];
      }

      if(params.shuffle){
        console.log('item set shuffled');
        shuffleArray(itemSet);
        item = itemSet[0];
      }

      const player = window.spotifyPlayer;
      const previouslyPlayingItem = getters.currentlyPlayingItem;
      let currentlyPlayingItemUri = getters.currentlyPlayingItemUri;

      const currentItemToggled = (item ? currentlyPlayingItemUri === item.uri : false);
      const startingNewTrack = (previouslyPlayingItem && previouslyPlayingItem.uri !== item.uri);

      console.log(`togglePlay pressed for ${item.name} (previously playing: ${previouslyPlayingItem.name || 'nothing'})`);

      //if there was nothing playing and now there is, or if item playing has been toggled, flip the boolean
      if(!currentlyPlayingItemUri || currentItemToggled){
        commit('setAudioPlaying', !getters.audioPlaying);
      }

      commit('setCurrentlyPlayingItemUri', item.uri);
      currentlyPlayingItemUri = item.uri;

      const setPlaybackIcon = (item) => {
        commit('setItemPlaybackIcon', {item, icon: ((item.uri === currentlyPlayingItemUri) && (getters.audioPlaying || startingNewTrack)) ? 'pause' : 'play'});
      };

      if(previouslyPlayingItem.uri){
        setPlaybackIcon(previouslyPlayingItem);

        if(startingNewTrack){
          setPlaybackIcon(item);
          commit('setAudioPlaying', true);
        }
      }
      //if no prev item, we know the current item has just been toggled to start playing, so needs to show pause
      else if(getters.audioPlaying){
        commit('setItemPlaybackIcon', {item, icon: 'pause'});
      }

      //toggled same item
      if(currentItemToggled){
        try{
          await player.togglePlay();
        }
        catch(error){
          console.log(error);
          dispatch('stopPlayback');
        }
      }
      //playing new item
      else{ 
        const feedId = params.doNotRestartQueue ? item.feedId : uuid();
        //has to be at top of logic for icons to work right
        commit('setCurrentlyPlayingItem', {item, feedId});

        dispatch(`${FEED}/addToFeed`, {track: item, feedId}, {root: true});
      
        if(!params.doNotRestartQueue){
          const currentlyPlayingItemIndex = itemSet.findIndex(setItem => setItem.id === item.id);        
          dispatch(`${PLAYBACK_QUEUE}/startPlaybackQueue`, {index: currentlyPlayingItemIndex, itemSet: itemSet.length ? itemSet : [item], feedId}, {root: true});
        }

        if(accessTokenExpired()){
          await refreshToken(); 
        }

        await dispatch('playItem', item);
        commit('setNewApiPlayback', feedId);
      }
    }
    catch(error){
      console.log(error);
      dispatch('stopPlayback');
    }
  },
  stopPlayback({commit, getters}, noError){
    if(getters.currentlyPlayingItemUri){
      const player = window.spotifyPlayer;
      const currentlyPlayingItem = getters.currentlyPlayingItem;

      if(player && player.pause){
        player.pause();
      }

      commit('setItemPlaybackIcon', {item: currentlyPlayingItem, icon: 'play'});
      commit('setAudioPlaying', false);
      commit('setCurrentlyPlayingItem', {});
      commit('setCurrentlyPlayingItemUri', '');
      commit(`${PLAYBACK_QUEUE}/clearQueue`, null, {root: true});

      if(!noError){
        commit(`${UI}/setToast`, {text: 'There was an issue playing music lorem ipsum...', error: true}, {root: true});
      }
    }
  },
  async seekPlayback({getters, dispatch, commit}, seekPosition){
    const player = window.spotifyPlayer;

    if(player && player.seek){
      try{
        await player.seek(seekPosition);
        await player.resume();
        commit('setAudioPlaying', true);
      }
      catch(error){
        console.error(error);
        dispatch('stopPlayback');
      }
    }
  }
};

export const mutations = {
  setSpotifyDeviceId(state, deviceId){
    state.spotifyDeviceId = deviceId;
  },
  setCurrentlyPlayingItemUri(state, itemUri){
    state.currentlyPlayingItemUri = itemUri;
  },
  setCurrentlyPlayingItem(state, params){
    state.currentlyPlayingItem = {...params.item, feedId: params.feedId};
  },
  setItemPlaybackIcon(state, params){
    params.item.playbackIcon = params.icon
  },
  setAudioPlaying(state, playing){
    console.log(`setting audioPlaying to ${playing}`);
    state.audioPlaying = playing;
  },
  setNewApiPlayback(state, feedId){
    state.newApiPlayback = feedId;
  }
};
//TODO try to handle external pausing (e.g. from headphone) - player_state_changed - compare if prev playing and now paused and vice versa