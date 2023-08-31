import {handleApiError} from '~/api/_utils';
import {PLAYBACK_QUEUE, FEED, UI, USER} from './constants';
import {shuffleArray, processAlbum, takeUntilNotATrack, initSpotifyPlayer, isSameTrack, getMoreTracksForQueue} from '~/utils/helpers';
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
    pendingFirstPlay: false,
    currentlyPlayingCollection: null,
    shuffle: false
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
  },
  currentlyPlayingCollection: (state) => {
    return state.currentlyPlayingCollection;
  },
  isShuffled: (state) => {
    return state.shuffled;
  }
};

const handlePause = (getters, playing) => {
  const audioPlaying = getters ? getters.audioPlaying : playing;

  if('mediaSession' in navigator){
    const audioElement = document.getElementById('silentPlayer');

    if(audioElement){
      if(audioPlaying) audioElement.play();
      else audioElement.pause();
    }
    
    navigator.mediaSession.playbackState = audioPlaying ? 'playing' : 'paused';
  }
}

export const actions = {
  togglePlayback: async ({commit, getters, dispatch}, {
    item, 
    playingAllFeed, 
    itemSet, 
    shuffle, 
    playingTrackWithinExistingQueue, 
    playingNextTrack,
    playingNextTrackNow,
    pause
  }) => {
    try{
      if(getters.sdkReady && !getters.player){
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
      const currentItemToggled = !playingAllFeed && !shuffle && isSameTrack(previouslyPlayingItem, item);

      //console.log(`togglePlay pressed for ${item.name} (previously playing: ${previouslyPlayingItem.name || 'nothing'})`);
  
      if(nothingWasPlaying || currentItemToggled){
        commit('setAudioPlaying', !getters.audioPlaying);
      }

      if(currentItemToggled){
        await player.togglePlay();
        handlePause(getters);
        return;
      }
      else {
        commit('setShuffled', shuffle);
        let queue = [];

        if(item.isCollection){
          commit('setCurrentlyPlayingCollection', item.name);
          const collectionUri = item.uri;
          //console.log(`collection toggled: ${item.name} - ${collectionUri}`);

          if(item.isPlaylist){
            queue = shuffle ? item.details.preShuffledTracks : item.details.playlistTracks;

            //for next time
            if(shuffle){
              if(item.details.allTracksFetched){
                item.details.preShuffledTracks = shuffleArray(item.details.preShuffledTracks);
              }
              else{ 
                getMoreTracksForQueue({
                  totalTracks: item.details.totalPlaylistTracks, 
                  url: `/playlists/${item.id}`, 
                  itemOffset: item.details.offset
                }).then(function({tracks}){
                  this.preShuffledTracks = tracks;
                }.bind(item.details));
              }
            }
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
          item = shuffleArray(queue)[0];
        }

        commit('setAudioPlaying', true);
        const queueId = playingTrackWithinExistingQueue || item.queueId ? item.queueId : uuid();
        commit('setCurrentlyPlayingItem', {...item, queueId});
        commit('setCurrentlyPlayingItemUri', queueId);

        const currentlyPlayingItemIndex = item.queueIndex || queue.findIndex(setItem => setItem.uuid === item.uuid);
        queue = queue.length ? queue : [item];

        await dispatch('playItem', {
          item,
          queue,
          previouslyPlayingItem,
          currentlyPlayingItemIndex,
          playingNextTrack,
          playingNextTrackNow
        });
        
        commit('setNewPlayback', queueId);

        if(playingTrackWithinExistingQueue){  
          dispatch(`${PLAYBACK_QUEUE}/checkForEndOfQueue`, null, {root: true});
        }
        else{
          commit(`${PLAYBACK_QUEUE}/startQueue`, {index: currentlyPlayingItemIndex, queue, queueId}, {root: true});
        }

        dispatch(`${FEED}/addToFeed`, {track: item, queueId}, {root: true});

        //lock screen
        if('mediaSession' in navigator){
          navigator.mediaSession.metadata = new MediaMetadata({
            title: item.name,
            artist: item.secondaryLabel,
            album: item.trackFromAlbum ? item.album.name : '',
            artwork: [
              { src: item.imgUrl.small, sizes: '96x96', type: 'image/png' },
              { src: item.imgUrl.medium, sizes: '128x128', type: 'image/png' },
              { src: item.imgUrl.medium, sizes: '192x192', type: 'image/png' },
              { src: item.imgUrl.medium, sizes: '256x256', type: 'image/png' },
              { src: item.imgUrl.medium, sizes: '384x384', type: 'image/png' },
              { src: item.imgUrl.large, sizes: '512x512', type: 'image/png' },
            ]
          });

          if(playingTrackWithinExistingQueue && queue[currentlyPlayingItemIndex - 1]){
            navigator.mediaSession.setActionHandler('previoustrack', () => {
              dispatch(`${PLAYBACK_QUEUE}/playPreviousTrack`, null, {root: true});
            });
          }
          else{
            navigator.mediaSession.setActionHandler('previoustrack', null);
          }

          if(queue[currentlyPlayingItemIndex + 1]){
            navigator.mediaSession.setActionHandler('nexttrack', () => {
              dispatch(`${PLAYBACK_QUEUE}/playNextTrack`, {playingNextTrackNow: true}, {root: true});
            });
          }
          else{
            navigator.mediaSession.setActionHandler('nexttrack', null);
          }

          navigator.mediaSession.setActionHandler('pause', function() {
            dispatch('togglePlayback', {pause: true});
          });
          
          navigator.mediaSession.setActionHandler('play', function() {
            dispatch('togglePlayback', {item});
          });

          navigator.mediaSession.playbackState = 'playing';
        }

        commit(`${PLAYBACK_QUEUE}/setNextTrackModified`, false, {root: true});
        //skip api call if not playing anything (no device on Spotify side)
        dispatch('toggleTrackRepeat', {repeat: false, skipApiCall: nothingWasPlaying});
      }
    }
    catch(error){
      //console.log(error);
      dispatch('stopPlayback');
    }
  },
  playItem: async ({getters, rootGetters}, {
    item, 
    queue, 
    previouslyPlayingItem,
    currentlyPlayingItemIndex, 
    playingNextTrack, 
    playingNextTrackNow
  }) => {
    try {
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

      if(!isSafari){
        if(getters.sdkReady){
          //must init player on first play via user interaction (not app load) due to browser audio context requirements
          if(!storageGet(DEVICE_ID)){
            await initSpotifyPlayer();
          }
        }
        else{
          throw new Error('sdk not ready...');
        }
      }

      if(rootGetters[`${USER}/profile`].id == '22xmerkgpsippbpbm4b2ka74y'){//don't take playback from Candace
        //console.log('skipping Candace playback logic');
        return;
      }

      let makePlaybackApiCall = true;

      if(playingNextTrack && !playingNextTrackNow){
        let currentState;
      
        if(getters.player){
          currentState = await getters.player.getCurrentState();
        }

        //console.log('currentState:', currentState);

        if(currentState){
          const spotifyCurrentTrack = currentState.track_window.current_track;
          //console.log(`current Spotify track: ${spotifyCurrentTrack.name} ${spotifyCurrentTrack.duration_ms} ${spotifyCurrentTrack.uri}`);          
          //console.log(`our item: ${item.name} ${item.duration_ms} ${item.uri}`);

          if(spotifyCurrentTrack && isSameTrack(spotifyCurrentTrack, item)){
            //console.log(`letting Spotify play the current track: ${item.name}`);
            makePlaybackApiCall = false;
          }
          else{
            const spotifyCurrentIsOurPrev = spotifyCurrentTrack && isSameTrack(previouslyPlayingItem, spotifyCurrentTrack);
            const spotifyNextTrack = currentState.track_window.next_tracks[0];
            const correctNextTrack = spotifyNextTrack && isSameTrack(spotifyNextTrack, item);
            
            if(spotifyNextTrack){
              //console.log(`NEXT SPOTIFY TRACK::: ${spotifyNextTrack.name} ${spotifyNextTrack.duration_ms} ${spotifyNextTrack.uri}`)
            }

            //console.log('spotifyCurrentIsOurPrev', spotifyCurrentIsOurPrev);
            //console.log('correctNextTrack', correctNextTrack);
            
            if(spotifyCurrentIsOurPrev && correctNextTrack){
              //console.log(`letting Spotify play the play next track: ${item.name}`);
              makePlaybackApiCall = false;
            }
          }
        }
      }

      if(makePlaybackApiCall){
        //send as many tracks as possible;
        //prevents Spotify from having no next tracks as often because when we allow them to play 2nd of the two we were sending originally,
        //they had no knowledge of what was after that in queue (as expected);
        //doing it this way leads to spotify just continuing to play from their side more (what we want) instead of api call due to them having 
        //correct next track more often; has to use passed-in queue instead of rootGetters due to getter timing not being reliable

        let nextTracksToSend = null;

        if(item.uri.indexOf('track') > 0){
          nextTracksToSend = takeUntilNotATrack(queue.slice(currentlyPlayingItemIndex + 1), item => item.type == 'album').slice(0, 20);
        }
        else{
          //console.log('about to play an album-type track -> won\'t send next track uris');
        }

        await startItemPlayback(item, nextTracksToSend);
      
        if(getters.player){
          setTimeout(async () => {  
            const currentState = await getters.player.getCurrentState();

            if(currentState){
              const spotifyCurrentTrack = currentState.track_window.current_track;
              //console.log(`current spotify track per sdk after api call: ${spotifyCurrentTrack.name}...${spotifyCurrentTrack.uri}`);
              //console.log(`our track: ${item.name}...${item.uri}`);

              //comparing uris nor using isSameTrack() worked (they seem to pull a different version of track often so even the track number has been seen to be different) so using name

              if(spotifyCurrentTrack.name != item.name){
                //console.log('spotify playing wrong track after API call...calling again');
                await startItemPlayback(item, nextTracksToSend);
              }
            }
          }, 200);
        }
      }

      if(getters.player){
        getters.player.resume();
      }
    }
    catch(error){
      //console.error(error);
      handleApiError('Something went wrong playing music...');
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
        commit(`${UI}/setToast`, {text: 'Something went wrong...', error: true}, {root: true});
      }

      if(process.client){
        storageRemove(DEVICE_ID);

        if('mediaSession' in navigator){
          navigator.mediaSession.setPositionState(null);
        }
      }

      commit('setShuffled', false);
  },
  async seekPlayback({getters, commit}, seekPosition){
    const player = getters.player;

    if(player && player.seek){
      try{
        if(/^((?!chrome|android).)*safari/i.test(navigator.userAgent)){
          await spotify({url: `/me/player/seek?position_ms=${Math.floor(seekPosition)}`, method: 'PUT'});
        }
        else {
          await player.seek(seekPosition);
        }

        await player.resume();
        commit('setAudioPlaying', true);
      }
      catch(error){
        //console.error(error);
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
        //console.error(error);
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
    //////console.log(`setting audioPlaying to ${playing}`);
    state.audioPlaying = playing;

    if(process.client){
      handlePause(null, playing);
    }
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
  },
  setCurrentlyPlayingCollection: (state, collection) => {
    state.currentlyPlayingCollection = collection;
  },
  setShuffled: (state, shuffled) => {
    state.shuffled = shuffled;
  }
};