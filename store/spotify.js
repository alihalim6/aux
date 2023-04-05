import {handleApiError} from '~/api/_utils';
import {PLAYBACK_QUEUE, FEED, UI, USER} from './constants';
import {shuffleArray, initSpotifyPlayer, processAlbum, takeUntilNotATrack} from '~/utils/helpers';
import {v4 as uuid} from 'uuid';
import startItemPlayback from '~/api/startItemPlayback';
import {storageGet, storageRemove} from '~/utils/storage';
import {DEVICE_ID} from '~/utils/constants';
import spotify from '~/api/spotify';

export const state = () => {
  return {
    currentlyPlayingItemUri: '',//simple string (changed to be feedId down the road) so that watcher for this doesn't have to be deep on object (performance)
    currentlyPlayingItem: {},
    audioPlaying: false,
    newPlayback: '',
    sdkReady: false,
    player: null,
    setToRepeatTrack: false
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
  },
  setToRepeatTrack: (state) => {
    return state.setToRepeatTrack;
  }
};

export const actions = {
  togglePlayback: async ({commit, getters, dispatch}, {
    item, 
    playingAllFeed, 
    itemSet, 
    shuffle, 
    playingTrackWithinExistingQueue, 
    nextTrackButtonPressed, 
    playingNextTrack,
    playingNextTrackNow
  }) => {
    try{
      const player = getters.player;
      const previouslyPlayingItem = getters.currentlyPlayingItem;
      let currentlyPlayingItemUri = getters.currentlyPlayingItemUri;
      const currentItemToggled = !playingAllFeed && (currentlyPlayingItemUri === item.feedId);

      //console.log(`togglePlay pressed for ${item.name} (previously playing: ${previouslyPlayingItem.name || 'nothing'})`);
  
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

        if(item.isCollection){
          const collectionUri = item.uri;
          //console.log(`collection toggled: ${item.name} - ${collectionUri}`);

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
          //console.log('item set shuffled');
          shuffleArray(queue);
          item = queue[0];
        }

        const feedId = playingTrackWithinExistingQueue || item.feedId ? item.feedId : uuid();
        commit('setCurrentlyPlayingItem', {...item, feedId});
        commit('setCurrentlyPlayingItemUri', feedId);

        const currentlyPlayingItemIndex = item.queueIndex || queue.findIndex(setItem => setItem.uuid === item.uuid);
        queue = queue.length ? queue : [item];

        await dispatch('playItem', {item, queue, currentlyPlayingItemIndex, playingNextTrack, nextTrackButtonPressed, playingNextTrackNow});

        if(playingTrackWithinExistingQueue){  
          dispatch(`${PLAYBACK_QUEUE}/checkForEndOfQueue`, null, {root: true});
        }
        else{
          commit(`${PLAYBACK_QUEUE}/startQueue`, {index: currentlyPlayingItemIndex, queue, feedId}, {root: true});
        }

        //skip api call because on very first session play, Spotify side is not ready with the new device
        dispatch('toggleTrackRepeat', {repeat: false, skipApiCall: !previouslyPlayingItem.feedId});
        commit('setNewPlayback', feedId);
        dispatch(`${FEED}/addToFeed`, {track: item, feedId}, {root: true});
      }
    }
    catch(error){
      //console.log(error);
      dispatch('stopPlayback');
    }
  },
  playItem: async ({getters, rootGetters, dispatch}, {
    item, 
    queue, 
    currentlyPlayingItemIndex, 
    playingNextTrack, 
    nextTrackButtonPressed,
    playingNextTrackNow
  }) => {
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

      if(rootGetters[`${USER}/profile`].id == '22xmerkgpsippbpbm4b2ka74y'){//don't take playback from Candace
        //console.log('skipping Candace playback logic');
        return;
      }

      if(playingNextTrack && !playingNextTrackNow){
        let currentState;
      
        if(getters.player){
          currentState = await getters.player.getCurrentState();
        }

        if(currentState){
          //console.log(`current Spotify track: ${currentState.track_window.current_track.name}`);
          //console.log(`next Spotify track: ${currentState.track_window.next_tracks[0] ? currentState.track_window.next_tracks[0].name : 'nada'}`);
          
          if(currentState.track_window.current_track && currentState.track_window.current_track.uri == item.uri){
            //console.log(`letting Spotify play the current track: ${item.name}`);
            return;
          }

          if(currentState.track_window.next_tracks.length && currentState.track_window.next_tracks[0].uri == item.uri){
            //console.log(`letting Spotify play the play next track: ${item.name}`);
            
            if(nextTrackButtonPressed){
              //console.log('next button pressed, changing tracks manually...');
              await spotify({url: 'me/player/next', method: 'POST'});
            }

            return;
          }
        }
      }

      //send as many tracks as possible;
      //prevents Spotify from having no next tracks as often because when we allow them to play 2nd of the two we were sending originally,
      //they had no knowledge of what was after that in queue (as expected);
      //doing it this way leads to sdk is used more (what we want) instead of api call due to them having correct next track more often;

      //has to use passed in queue instead of rootGetters due to getter timing not being reliable
      let nextTracksToSend = null;

      if(item.uri.indexOf('track') > 0){
        nextTracksToSend = takeUntilNotATrack(queue.slice(currentlyPlayingItemIndex + 1), item => item.type == 'album');
      }
      else{
        //console.log('about to play an album-type track -> won\'t send next track uris');
      }

      await startItemPlayback(item, nextTracksToSend);

      //if playing an album-type track and the queue has a next track, send that to Spotify to be the next track at least to help keep us on same page
      if(queue.length > 1 && !nextTracksToSend){
        const nextTrack = queue[currentlyPlayingItemIndex + 1];

        if(nextTrack.uri.indexOf('track') > -1){
          //console.log(`adding the next track to spotify queue...${nextTrack.name}`);
          spotify({url: `/me/player/queue?uri=${nextTrack.uri}&device_id=${storageGet(DEVICE_ID)}`, method: 'POST'});
        }
      }
    }
    catch(error){
      //console.error(error);
      dispatch('stopPlayback');
      handleApiError('There was an issue with playback lorem ipsum...');
    }
  },
  stopPlayback({commit, getters}, noError){
    if(getters.currentlyPlayingItemUri){
      const currentlyPlayingItem = getters.currentlyPlayingItem;

      if(getters.player){
        //needs to be disconnect so that on Spotify side, no rogue plays, and things clear out properly (e.g. stopping and replaying an album
        //looks like a pause/play toggle to them if we were to use pause())
        getters.player.disconnect();
      }
      
      commit('setItemPlaybackIcon', {item: currentlyPlayingItem, icon: 'play'});
      commit('setAudioPlaying', false);
      commit('setCurrentlyPlayingItem', {});
      commit('setCurrentlyPlayingItemUri', '');
      commit('setNewPlayback', '');
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
        //console.error(error);
        dispatch('stopPlayback');
      }
    }
  },
  async toggleTrackRepeat({getters, commit}, params){
    const repeatTrack = (params == undefined) ? !getters.setToRepeatTrack : params.repeat;
    commit('setTrackRepeat', repeatTrack);

    if(!params || !params.skipApiCall){
      await spotify({url: `/me/player/repeat?state=${repeatTrack ? 'track' : 'off'}`, method: 'PUT'});
    }
  },
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
    ////console.log(`setting audioPlaying to ${playing}`);
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
  },
  setTrackRepeat(state, value){
    state.setToRepeatTrack = value;
  }
};