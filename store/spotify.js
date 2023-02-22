import {handleApiError} from '~/api/_utils';
import {PLAYBACK_QUEUE, FEED, UI, USER} from './constants';
import {shuffleArray, initSpotifyPlayer} from '~/utils/helpers';
import {v4 as uuid} from 'uuid';
import startItemPlayback from '~/api/startItemPlayback';
import {storageGet, storageRemove} from '~/utils/storage';
import {DEVICE_ID} from '~/utils/constants';

export const state = () => {
  return {
    currentlyPlayingItemUri: '',//simple string so that watcher for this doesn't have to be deep on object (performance)
    currentlyPlayingItem: {},
    audioPlaying: false,
    newPlayback: '',
    sdkReady: false,
    player: null
  };
};

export const getters = {
  currentlyPlayingItemUri: (state) => {
    return state.currentlyPlayingItemUri;
  },
  currentlyPlayingItem: (state) => {
    return state.currentlyPlayingItem;
  },
  audioPlaying: (state) => {
    return state.audioPlaying;
  },
  newPlayback: (state) => {
    return state.newPlayback;
  },
  sdkReady: (state) => {
    return state.sdkReady;
  },
  player: (state) => {
    return state.player;
  } 
};

export const actions = {
  togglePlayback: async ({commit, getters, dispatch}, params) => {
    try{
      let item = params.item;
      const player = getters.player;
      const previouslyPlayingItem = getters.currentlyPlayingItem;
      let currentlyPlayingItemUri = getters.currentlyPlayingItemUri;
      const currentItemToggled = (item ? currentlyPlayingItemUri === item.feedId : false);

      console.log(`togglePlay pressed for ${item.name} (previously playing: ${previouslyPlayingItem.name || 'nothing'})`);
  
      //if there was nothing playing and now there is, or if item playing has been toggled, flip the boolean
      if(!currentlyPlayingItemUri || currentItemToggled){
        commit('setAudioPlaying', !getters.audioPlaying);
      }

      if(currentItemToggled){
        await player.togglePlay();
        return;
      }
      else {
        commit('setAudioPlaying', true);

        let itemSet = [];

        //if album or playlist toggled, intercept logic to begin play from its first track instead of whole item (so that we can manage queue via tracks)
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
        else if(params.itemSet){
          itemSet = params.itemSet.filter(item => !item.isArtist && !item.isCollection);
        }

        if(params.shuffle){
          console.log('item set shuffled');
          shuffleArray(itemSet);
          item = itemSet[0];
        }

        const feedId = params.playingTrackWithinExistingQueue ? item.feedId : uuid();
        commit('setCurrentlyPlayingItem', {...item, feedId});
        commit('setCurrentlyPlayingItemUri', feedId);
        
        await dispatch('playItem', {item, playingNextTrack: params.playingNextTrack});
        commit('setNewPlayback', feedId);

        dispatch(`${FEED}/addToFeed`, {track: item, feedId}, {root: true});
      
        if(!params.playingTrackWithinExistingQueue){
          const currentlyPlayingItemIndex = itemSet.findIndex(setItem => setItem.id === item.id);        
          commit(`${PLAYBACK_QUEUE}/startQueue`, {index: currentlyPlayingItemIndex, itemSet: itemSet.length ? itemSet : [item], feedId}, {root: true});
        }
      }
    }
    catch(error){
      console.log(error);
      dispatch('stopPlayback');
    }
  },
  playItem: async ({getters, rootGetters, dispatch}, {item, playingNextTrack}) => {
    if(rootGetters[`${USER}/profile`].id == '22xmerkgpsippbpbm4b2ka74y'){//don't take playback from Candace
      console.log('skipping Candace playback logic');
      return;
    }

    try {
      if(getters.sdkReady){
        //must init player on first play via user interaction (not app load) due to browser audio context requirements
        if(!storageGet(DEVICE_ID)){
          await initSpotifyPlayer();
        }
      }
      else{
        throw new Error('sdk not ready...');
      }

      let currentState;
      
      if(playingNextTrack && getters.player){
        currentState = await getters.player.getCurrentState();
      }

      if(currentState){
        console.log(`currentState next tracks length: ${currentState.track_window.next_tracks.length}`);
        console.log(currentState.track_window.next_tracks[0], item);
      }

      if(currentState && currentState.track_window.next_tracks.length && currentState.track_window.next_tracks[0].uri == item.uri){
        console.log(`using sdk player to play next track ${currentState.track_window.next_tracks[0].name}`);
        await getters.player.nextTrack();
      }
      else {
        await startItemPlayback(item);
      }
    }
    catch(error){
      console.error(error);
      dispatch('stopPlayback');
      handleApiError('There was an issue with playback lorem ipsum...');
    }
  },
  stopPlayback({commit, getters}, noError){
    if(getters.currentlyPlayingItemUri){
      const player = getters.player;
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
        storageRemove(DEVICE_ID);
      }
    }
  },
  async seekPlayback({getters, dispatch, commit}, seekPosition){
    const player = getters.player;

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
  setCurrentlyPlayingItemUri(state, itemUri){
    state.currentlyPlayingItemUri = itemUri;
  },
  setCurrentlyPlayingItem(state, item){
    state.currentlyPlayingItem = item;
  },
  setItemPlaybackIcon(state, params){
    params.item.playbackIcon = params.icon;
  },
  setAudioPlaying(state, playing){
    console.log(`setting audioPlaying to ${playing}`);
    state.audioPlaying = playing;
  },
  setNewPlayback(state, feedId){
    state.newPlayback = feedId;
  },
  setSdkReady(state){
    state.sdkReady = true;
  },
  setPlayer(state, player){
    state.player = player;
  }
};