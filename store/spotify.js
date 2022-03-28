import {httpClient} from '~/utils/api';

export const state = () => {
    return {
        spotifyDeviceId: '',
        currentlyPlayingItemUri: '',//simple string so that watcher for this doesn't have to be deep on object (performance)
        currentlyPlayingItem: {},
        spotifyPlayer: {},
        devicePlaybackTransferNeeded: true,
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
        await httpClient.post('/playback/playItem', {
            item, 
            deviceId: getters.spotifyDeviceId, 
            devicePlaybackTransferNeeded: getters.devicePlaybackTransferNeeded
        });

        commit('setDevicePlaybackTransferNeeded', false);
    },
    togglePlayback: async ({commit, getters, dispatch}, item) => {
        try{
            const player = getters.spotifyPlayer;
            const previouslyPlayingItem = getters.currentlyPlayingItem;
            let currentlyPlayingItemUri = getters.currentlyPlayingItemUri;

            const currentItemToggled = (item ? currentlyPlayingItemUri === item.uri : false);
            const startingNewTrack = (previouslyPlayingItem && previouslyPlayingItem.uri !== item.uri);

            console.log(`togglePlay pressed for ${item.uri} (previously playing: ${currentlyPlayingItemUri})`);

            //if there was nothing playing and now there is, or if item playing has been toggled, flip the boolean
            if(!currentlyPlayingItemUri || currentItemToggled){
                commit('setAudioPlaying', !getters.audioPlaying);
            }

            commit('setCurrentlyPlayingItemUri', item.uri);
            currentlyPlayingItemUri = item.uri;

            const setPlaybackIcon = (item) => {
                commit('setItemPlaybackIcon', {item, icon: ((item.uri === currentlyPlayingItemUri) && (getters.audioPlaying || startingNewTrack)) ? 'pause' : 'play'});
            };

            if(previouslyPlayingItem){
                //same item if toggling item
                setPlaybackIcon(previouslyPlayingItem);
                setPlaybackIcon(item);
            }
            //if no prev item, we know the current item has just been toggled to start playing, so needs to show pause
            else if(getters.audioPlaying){
                commit('setItemPlaybackIcon', {item, icon: 'pause'});
            }

            //TODO handle error
            if(currentItemToggled){
                await player.togglePlay();
            }
            else{
                if(currentlyPlayingItemUri){
                    await getters.spotifyPlayer.pause();
                }

                await dispatch('playItem', item);
                
                commit('setAudioPlaying', true);
                commit('setCurrentlyPlayingItem', item)
                
                //////
                const playerState = await player.getCurrentState();
                
                if (!playerState) {
                    console.error('User is not playing music through the Web Playback SDK');
                    await player.connect();
                }

                try{
                    //make sure new track playing starts at beginning
                    await player.seek(0);
                }
                catch(error){
                    console.log(`error setting player to 0ms after playing item api call: ${error}`);
                }
            }

            commit('setSpotifyPlayer', player);
        }
        catch(error){
            console.log(error);
            dispatch('stopPlayback');
        }
    },
    stopPlayback({commit}){
        const player = getters.spotifyPlayer;
        const currentlyPlayingItem = getters.currentlyPlayingItem;

        if(player && player.pause){
            player.pause();
        }

        commit('setItemPlaybackIcon', {item: currentlyPlayingItem, icon: 'play'});
        commit('ui/setToast', {display: true, text: 'There was an issue playing music lorem ipsum...'}, {root: true});
    }
};

export const mutations = {
    setSpotifyDeviceId(state, deviceId){
        state.devicePlaybackTransferNeeded = (state.spotifyDeviceId !== deviceId);
        state.spotifyDeviceId = deviceId;
    },
    setCurrentlyPlayingItemUri(state, itemUri){
        state.currentlyPlayingItemUri = itemUri;
    },
    setCurrentlyPlayingItem(state, item){
        state.currentlyPlayingItem = item;
    },
    setSpotifyPlayer(state, player){
        state.spotifyPlayer = player;
    },
    setDevicePlaybackTransferNeeded(state, needed){
        state.devicePlaybackTransferNeeded = needed;
    },
    setItemPlaybackIcon(state, payload){
        payload.item ? payload.item.playbackIcon = payload.icon : null;
    },
    setAudioPlaying(state, playing){
        console.log(`setting audioPlaying to ${playing}`);
        state.audioPlaying = playing;
    }
};

//TODO try to handle external pausing (e.g. from headphone) - player_state_changed - compare if prev playing and now paused and vice versa