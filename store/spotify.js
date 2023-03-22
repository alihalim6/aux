import {handleApiError} from '~/api/_utils';
import {PLAYBACK_QUEUE, FEED, UI, USER} from './constants';
import {shuffleArray, initSpotifyPlayer, processAlbum} from '~/utils/helpers';
import {v4 as uuid} from 'uuid';
import startItemPlayback from '~/api/startItemPlayback';
import {storageGet, storageRemove} from '~/utils/storage';
import {DEVICE_ID} from '~/utils/constants';

export const state = () => {
  return {
    currentlyPlayingItemUri: '',//simple string (changed to be feedId down the road) so that watcher for this doesn't have to be deep on object (performance)
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
  togglePlayback: async ({commit, getters, dispatch}, {item, playingAllFeed, itemSet, shuffle, playingTrackWithinExistingQueue, nextTrackButtonPressed, playingNextTrack}) => {
    try{
      const player = getters.player;
      const previouslyPlayingItem = getters.currentlyPlayingItem;
      let currentlyPlayingItemUri = getters.currentlyPlayingItemUri;
      const currentItemToggled = !playingAllFeed && (currentlyPlayingItemUri === item.feedId);

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

        let queue = [];

        //if album or playlist toggled, intercept logic to begin play from its first track instead of whole item (so that we can manage queue via tracks)
        if(item.isCollection){
          const collectionUri = item.uri;
          console.log(`collection toggled: ${item.name} - ${collectionUri}`);

          if(item.isPlaylist){
            queue = item.details.playlistTracks;
          }
          else if(item.isAlbum){
            if(!item.details){
              await processAlbum(item);
            }

            queue = item.details.albumTracks;
          }
          else{
            queue = itemSet;
          }

          item = queue[0];
        }
        else if(itemSet){
          queue = itemSet.filter(item => !item.isArtist && !item.isCollection);
        }

        if(shuffle){
          console.log('item set shuffled');
          shuffleArray(queue);
          item = queue[0];
        }

        const feedId = playingTrackWithinExistingQueue || item.feedId ? item.feedId : uuid();
        commit('setCurrentlyPlayingItem', {...item, feedId});
        commit('setCurrentlyPlayingItemUri', feedId);
        
        queue = queue.length ? queue : [item];
        const currentlyPlayingItemIndex = queue.findIndex(setItem => setItem.id === item.id);

        if(!playingTrackWithinExistingQueue){
          commit(`${PLAYBACK_QUEUE}/startQueue`, {index: currentlyPlayingItemIndex, queue, feedId}, {root: true});
        }

        await dispatch('playItem', {item, queue, currentlyPlayingItemIndex, playingNextTrack, nextTrackButtonPressed});

        commit('setNewPlayback', feedId);

        dispatch(`${FEED}/addToFeed`, {track: item, feedId}, {root: true});
      }
    }
    catch(error){
      console.log(error);
      dispatch('stopPlayback');
    }
  },
  playItem: async ({getters, rootGetters, dispatch}, {item, queue, currentlyPlayingItemIndex, playingNextTrack, nextTrackButtonPressed}) => {
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

      if(playingNextTrack){
        let currentState;
      
        if(getters.player){
          currentState = await getters.player.getCurrentState();
        }

        if(currentState){
          console.log(`current Spotify track: ${currentState.track_window.current_track.name}`);
          console.log(`next Spotify track: ${currentState.track_window.next_tracks[0] ? currentState.track_window.next_tracks[0].name : 'nada'}`);
          
          if(currentState.track_window.current_track && currentState.track_window.current_track.uri == item.uri){
            console.log(`letting Spotify play the current track: ${item.name}`);
            return;
          }

          if(currentState.track_window.next_tracks.length && currentState.track_window.next_tracks[0].uri == item.uri){
            console.log(`letting Spotify play the play next track: ${item.name}`);
            
            if(nextTrackButtonPressed){
              console.log('next button pressed, changing tracks using sdk player...');
              await getters.player.nextTrack();
            }

            return;
          }
        }
      }

      const tracksOnly = !queue.find(item => item.type == 'album');
      const nextTracks = tracksOnly ? queue.slice(currentlyPlayingItemIndex + 1, 21) : null;

      //send up to next 20 tracks in queue (good for avg album);
      //prevents Spotify from having no next tracks as often because when we allow them to play 2nd of the two we were sending originally,
      //they had no knowledge of what was after that in queue (as expected) --> thus sdk is used more (what we want) instead of api call due to them having next track more often
      await startItemPlayback(item, nextTracks);
    }
    catch(error){
      console.error(error);
      dispatch('stopPlayback');
      handleApiError('There was an issue with playback lorem ipsum...');
    }
  },
  stopPlayback({commit, getters}, noError){
    if(getters.currentlyPlayingItemUri){
      const currentlyPlayingItem = getters.currentlyPlayingItem;

      if(getters.player){
        //disconnect in case spotify still automatically plays next track due to previously sending multiple 
        //uris then stopping (e.g. clearing up next tracks)
        getters.player.pause();
      }
      
      commit('setItemPlaybackIcon', {item: currentlyPlayingItem, icon: 'play'});
      commit('setAudioPlaying', false);
      commit('setCurrentlyPlayingItem', {});
      commit('setCurrentlyPlayingItemUri', '');
      commit(`${PLAYBACK_QUEUE}/clearQueue`, null, {root: true});

      if(!noError){
        commit(`${UI}/setToast`, {text: 'There was an issue lorem ipsum...', error: true}, {root: true});
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