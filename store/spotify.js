import {handleApiError} from '~/api/_utils';
import {PLAYBACK_QUEUE, FEED, UI, USER} from './constants';
import {shuffleArray, processAlbum, takeUntilNotATrack} from '~/utils/helpers';
import {v4 as uuid} from 'uuid';
import startItemPlayback from '~/api/startItemPlayback';
import {storageGet, storageRemove} from '~/utils/storage';
import {DEVICE_ID} from '~/utils/constants';
import spotify from '~/api/spotify';

export const state = () => {
  return {
    currentlyPlayingItemUri: '',//simple string (changed to be queueId down the road) so that watcher for this doesn't have to be deep on object (performance)
    currentlyPlayingItem: {},
    audioPlaying: false,
    newPlayback: '',
    sdkReady: false,
    player: null,
    setToRepeatTrack: false,
    pendingFirstPlay: false
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
  },
  pendingFirstPlay: (state) => {
    return state.pendingFirstPlay;
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
    playingNextTrackNow,
    pause
  }) => {
    try{
      if(!getters.player){
        await initSpotifyPlayer();
      }

      const player = getters.player;

      if(pause){
        commit('setAudioPlaying', false);

        try{
          await player.pause();
        }
        catch{}
        finally{
          return;
        }
      }

      const previouslyPlayingItem = getters.currentlyPlayingItem;
      let currentlyPlayingItemUri = getters.currentlyPlayingItemUri;
      let nothingWasPlaying = !currentlyPlayingItemUri;
      const currentItemToggled = !playingAllFeed && (currentlyPlayingItemUri === item.queueId);

      console.log(`togglePlay pressed for ${item.name} (previously playing: ${previouslyPlayingItem.name || 'nothing'})`);
  
      if(nothingWasPlaying || currentItemToggled){
        commit('setAudioPlaying', !getters.audioPlaying);
      }

      if(currentItemToggled){
        await player.togglePlay();
        return;
      }
      else {
        await player.setVolume(1);
        commit('setAudioPlaying', true);

        let queue = [];

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

        const queueId = playingTrackWithinExistingQueue || item.queueId ? item.queueId : uuid();
        commit('setCurrentlyPlayingItem', {...item, queueId});
        commit('setCurrentlyPlayingItemUri', queueId);

        const currentlyPlayingItemIndex = item.queueIndex || queue.findIndex(setItem => setItem.uuid === item.uuid);
        queue = queue.length ? queue : [item];

        await dispatch('playItem', {
          item,
          previouslyPlayingItem,
          queue,
          currentlyPlayingItemIndex,
          playingNextTrack,
          nextTrackButtonPressed,
          playingNextTrackNow,
          nothingWasPlaying
        });
        
        commit('setNewPlayback', queueId);

        if(playingTrackWithinExistingQueue){  
          dispatch(`${PLAYBACK_QUEUE}/checkForEndOfQueue`, null, {root: true});
        }
        else{
          commit(`${PLAYBACK_QUEUE}/startQueue`, {index: currentlyPlayingItemIndex, queue, queueId}, {root: true});
        }

        dispatch(`${FEED}/addToFeed`, {track: item, queueId}, {root: true});
      }
    }
    catch(error){
      console.log(error);
      dispatch('stopPlayback');
    }
  },
  playItem: async ({getters, rootGetters, dispatch}, {
    item, 
    previouslyPlayingItem,
    queue, 
    currentlyPlayingItemIndex, 
    playingNextTrack, 
    nextTrackButtonPressed,
    playingNextTrackNow,
    nothingWasPlaying
  }) => {
    try {
      if(rootGetters[`${USER}/profile`].id == '22xmerkgpsippbpbm4b2ka74y'){//don't take playback from Candace
        console.log('skipping Candace playback logic');
        return;
      }

      let makePlaybackApiCall = true;

      if(playingNextTrack && !playingNextTrackNow){
        let currentState;
      
        if(getters.player){
          currentState = await getters.player.getCurrentState();
        }

        if(currentState){
          console.log(`current Spotify track: ${currentState.track_window.current_track.name}`);
          console.log(`next Spotify track: ${currentState.track_window.next_tracks[0] ? currentState.track_window.next_tracks[0].name : 'nada'}`);
          
          if(currentState.track_window.current_track && currentState.track_window.current_track.uri == item.uri){
            console.log(`letting Spotify play the current track: ${item.name}`);
            makePlaybackApiCall = false;
          }

          const samePreviousTracks = previouslyPlayingItem.uri == currentState.track_window.current_track.uri;

          if(!nextTrackButtonPressed && 
            samePreviousTracks && 
            currentState.track_window.next_tracks.length && 
            currentState.track_window.next_tracks[0].uri == item.uri &&
            currentState.track_window.next_tracks[0].uri != previouslyPlayingItem.uri
          ){
            console.log(`letting Spotify play the play next track: ${item.name}`);
            makePlaybackApiCall = false;
          }
        }
      }

      if(makePlaybackApiCall){
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
          console.log('about to play an album-type track -> won\'t send next track uris');
        }

        await startItemPlayback(item, nextTracksToSend);

        //if playing an album-type track and the queue has a next track, send that to Spotify to be the next track at least to help keep us on same page
        if(queue.length > 1 && !nextTracksToSend){
          const nextTrack = queue[currentlyPlayingItemIndex + 1];

          if(nextTrack && nextTrack.uri.indexOf('track') > -1){
            console.log(`adding the next track to spotify queue...${nextTrack.name}`);
            spotify({url: `/me/player/queue?uri=${nextTrack.uri}&device_id=${storageGet(DEVICE_ID)}`, method: 'POST'});
          }
        }
      }

      //lock screen
      if('mediaSession' in navigator){
        navigator.mediaSession.metadata = new MediaMetadata({
          title: item.name,
          artist: item.secondaryLabel,
          album: item.trackFromAlbum ? item.album.name : '',
          artwork: [
            { src: item.imgUrl.small,   sizes: '96x96',   type: 'image/jpeg' },
            { src: item.imgUrl.medium, sizes: '128x128', type: 'image/png' },
            { src: item.imgUrl.medium, sizes: '192x192', type: 'image/png' },
            { src: item.imgUrl.medium, sizes: '256x256', type: 'image/jpeg' },
            { src: item.imgUrl.medium, sizes: '384x384', type: 'image/png' },
            { src: item.imgUrl.large, sizes: '512x512', type: 'image/jpeg' },
          ]
        });

        if(queue[currentlyPlayingItemIndex - 1]){
          navigator.mediaSession.setActionHandler('previoustrack', () => {
            dispatch(`${PLAYBACK_QUEUE}/playPreviousTrack`, null, {root: true});
          });
        }

        if(queue[currentlyPlayingItemIndex + 1]){
          navigator.mediaSession.setActionHandler('nexttrack', () => {
            dispatch(`${PLAYBACK_QUEUE}/playNextTrack`, {nextTrackButtonPressed: true}, {root: true});
          });
        }
      }

      //skip api call if not playing anything (no device on Spotify side)
      dispatch('toggleTrackRepeat', {repeat: false, skipApiCall: nothingWasPlaying});
    }
    catch(error){
      console.error(error);
      dispatch('stopPlayback');
      handleApiError('Something went wrong with playback...');
    }
  },
  stopPlayback({commit, getters}, noError){
    if(getters.currentlyPlayingItemUri){
      const currentlyPlayingItem = getters.currentlyPlayingItem;
      commit('setItemPlaybackIcon', {item: currentlyPlayingItem, icon: 'play'});
    }

      if(getters.player){
        //needs to be disconnect so that on Spotify side, no rogue plays, and things clear out properly (e.g. stopping and replaying an album
        //looks like a pause/play toggle to them if we were to use pause())
        getters.player.disconnect();
      }
      
      commit('setAudioPlaying', false);
      commit('setCurrentlyPlayingItem', {});
      commit('setCurrentlyPlayingItemUri', '');
      commit('setNewPlayback', '');
      commit(`${PLAYBACK_QUEUE}/clearQueue`, null, {root: true});

      if(!noError){
        commit(`${UI}/setToast`, {text: 'Could not compute...', error: true}, {root: true});
      }

      if(process.client){
        storageRemove(DEVICE_ID);
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
  },
  async toggleTrackRepeat({getters, commit}, params){
    const repeatTrack = (params == undefined) ? !getters.setToRepeatTrack : params.repeat;
    commit('setTrackRepeat', repeatTrack);

    if(!params || !params.skipApiCall){
      try {
        await spotify({url: `/me/player/repeat?state=${repeatTrack ? 'track' : 'off'}`, method: 'PUT'});
      }
      catch(error){
        console.error(error);
      }
    }
  },
  openItemInSpotify({dispatch, getters}, item){
    if(item.type == 'track'){
      dispatch('togglePlayback', {pause: true});
    }

    window.open(`https://open.spotify.com/${item.type}/${item.id}`, '_blank');
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
    ////console.log(`setting audioPlaying to ${playing}`);
    state.audioPlaying = playing;
  },
  setNewPlayback(state, queueId){
    state.newPlayback = queueId;
    state.pendingFirstPlay = false;
  },
  setSdkReady(state){
    state.sdkReady = true;
  },
  setPlayer(state, player){
    state.player = player;
  },
  setTrackRepeat(state, value){
    state.setToRepeatTrack = value;
  },
  setPendingFirstPlay(state, pending){
    state.pendingFirstPlay = pending;
  }
};