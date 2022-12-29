import {httpClient, handleApiError} from '~/utils/api';
import {refreshToken, accessTokenExpired} from '~/auth';
import {PLAYBACK_QUEUE, FEED} from './constants';
import {shuffleArray} from '~/utils/helpers';
import {v4 as uuid} from 'uuid';

export const state = () => {
  return {
    spotifyDeviceId: '',
    currentlyPlayingItemUri: '',//simple string so that watcher for this doesn't have to be deep on object (performance)
    currentlyPlayingItem: {},
    spotifyPlayer: {},
    devicePlaybackTransferNeeded: false,
    audioPlaying: false
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
  spotifyPlayer: (state) => {
    return state.spotifyPlayer;
  },
  devicePlaybackTransferNeeded: (state) => {
    return state.devicePlaybackTransferNeeded;
  },
  audioPlaying: (state) => {
    return state.audioPlaying;
  }
};

export const actions = {
  playItem: async ({commit, getters}, item) => {
    try {
      await httpClient.post('/playItem', {
        item, 
        deviceId: getters.spotifyDeviceId, 
        devicePlaybackTransferNeeded: getters.devicePlaybackTransferNeeded
      });
    }
    catch(error){
      dispatch('stopPlayback');
      handleApiError('There was an issue with playback lorem ipsum...');
    }

    commit('setDevicePlaybackTransferNeeded', false);
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

      const player = getters.spotifyPlayer;
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
        //these two lines are redundant (set icon for same item) if toggling item
        setPlaybackIcon(previouslyPlayingItem);
        setPlaybackIcon(item);
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

        dispatch(`${FEED}/addToFeed`, {track: item}, {root: true});
      
        if(!params.doNotRestartQueue){
          const currentlyPlayingItemIndex = itemSet.findIndex(setItem => setItem.id === item.id);        
          dispatch(`${PLAYBACK_QUEUE}/startPlaybackQueue`, {index: currentlyPlayingItemIndex, itemSet, feedId}, {root: true});
        }

        const playerState = await player.getCurrentState();

        if(!playerState){
          console.error('SDK player state not defined -- attempting to transfer playback to device and try to play item again...');
          commit('setDevicePlaybackTransferNeeded', true);
          await dispatch('playItem', item);
        }

        if(accessTokenExpired()){
          await refreshToken(); 
        }

        await dispatch('playItem', item);

        //TODO: try to start at beginning (Spotify starts in middle of song at times)
        //NOT WORKING OR NOT CONSISTENT
        await player.seek(0);

        commit('setAudioPlaying', true);
      }

      commit('setSpotifyPlayer', player);
    }
    catch(error){
      console.log(error);
      dispatch('stopPlayback');
    }
  },
  stopPlayback({commit, getters, dispatch}, noError){
    const player = getters.spotifyPlayer;
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
      commit('ui/setToast', {text: 'There was an issue playing music lorem ipsum...', error: true}, {root: true});
    }
  },
  async seekPlayback({getters, dispatch, commit}, seekPosition){
    const player = getters.spotifyPlayer;

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
  setSpotifyPlayer(state, player){
    state.spotifyPlayer = player;
  },
  setDevicePlaybackTransferNeeded(state, needed){
    state.devicePlaybackTransferNeeded = needed;
  },
  setItemPlaybackIcon(state, params){
    if(params.item){
      params.item.playbackIcon = params.icon
    }
  },
  setAudioPlaying(state, playing){
    console.log(`setting audioPlaying to ${playing}`);
    state.audioPlaying = playing;
  }
};
//TODO try to handle external pausing (e.g. from headphone) - player_state_changed - compare if prev playing and now paused and vice versa