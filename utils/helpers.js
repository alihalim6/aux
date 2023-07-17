import {storageGet, storageSet} from '~/utils/storage';
import {AUTH, IGNORED_USERS, DEVICE_ID, AUX_DEVICE_NAME, SPOTIFY_TRACK_ERROR_SKIP} from '~/utils/constants';
import {refreshToken, handleAuthError} from '~/auth';
import spotify from '~/api/spotify';
import {v4 as uuid} from 'uuid';
import {PLAYBACK_QUEUE, SPOTIFY, UI} from '~/store/constants';
import {handleApiError} from '~/api/_utils';
import {differenceInMinutes, differenceInHours, differenceInDays, parseISO} from 'date-fns';
import details from '~/api/details';
import axios from 'axios';

//aux-ify some of the values we get from Spotify
export const setItemMetaData = (items) => {
  if(!items){
    $nuxt.$store.commit(`${UI}/setToast`, {text: 'Something went wrong in the Spotify data!', error: true});
    return;
  }

  for(const item of items){
    if(!item){
      continue;
    }

    item.playbackIcon = 'play';
    item.isAlbum = item.type === 'album';
    item.isArtist = item.type === 'artist';
    item.isTrack = item.type === 'track';
    item.isPlaylist = item.type === 'playlist';
    item.uuid = uuid();

    try{
      item.imgUrl = {};

      const {url} = item.images ? item.images[0] : item.album.images[0];
      item.imgUrl.large = url;

      function setMediumAndSmall(imageItem){
        item.imgUrl.medium = imageItem.images[1].url;        
        item.imgUrl.small = imageItem.images[2].url;
      }

      if(item.images && item.images.length > 1){
        setMediumAndSmall(item);
      }

      if(item.album && item.album.images && item.album.images.length > 1){
        setMediumAndSmall(item.album);
      }
    }
    //not all items have images/album, so just catch instead of messy conditionals
    catch{}
      
    if(item.isAlbum || item.isTrack){
      const artists = item.artists.map(artist => artist.name);
      item.primaryLabel = item.name;
      item.secondaryLabel = artists.join(', ');

      if(item.isAlbum && item.total_tracks > 1){
        item.numberOfTracks = `${item.total_tracks} Tracks`;
      }

      if(item.isAlbum){
        item.albumType = (item.album_type == 'single' && item.total_tracks > 1) ? 'EP' : item.album_type.toUpperCase();
      }

      if(!item.fromCollection && item.isTrack && item.album && item.album.total_tracks > 1){
        handleItemCollection(item, item.album.uri);
      }
    }
    else if(item.isArtist){  
      item.primaryLabel = item.name;

      const genres = item.genres.map(genre => genre.toUpperCase());

      if(genres.length){
        item.secondaryLabel = genres.slice(0, 2).join(' / ');
      }
    }
    else if(item.isPlaylist){
      item.primaryLabel = item.name;
      item.secondaryLabel = item.description;
      item.numberOfTracks = `${item.tracks.total} Tracks`;
      item.albumType = 'PLAYLIST';
    }

    item.singleTrack = (item.isAlbum && (item.total_tracks === 1)) || (item.isTrack && (!item.album || item.album.total_tracks === 1));
    item.trackFromAlbum = item.isTrack && item.album && item.album.total_tracks > 1;
    item.isMultitrackAlbum = (item.isAlbum && !item.singleTrack);
    item.isCollection = item.isMultitrackAlbum || item.isPlaylist;

    if(item.singleTrack){
      item.singleArtistId = item.artists[0].id;
    }
  }

  return items;
};

export const handleItemCollection = (item, collectionId) => {
  if(item.fromCollection){
    item.fromCollection.push(collectionId);
  }
  else{
    item.fromCollection = [collectionId];
  }
};

//adapted from https://stackoverflow.com/a/9763769
export const msToDuration = (ms) => {
  function pad(n, paddingCheck) {
    let padding = 2;

    if(paddingCheck && (n < 10)){
      padding = 1;
    }

    return ('00' + n).slice(-padding);
  };

  let s = (ms - (ms % 1000)) / 1000;
  const secs = Math.ceil(s % 60);
  s = (s - secs) / 60;
  const mins = s % 60;
  const hrs = (s - mins) / 60;

  return (hrs ? pad(hrs, true) + ':' : '') + (mins ? pad(mins, !hrs) + ':' : '0:') + pad(secs, (!mins && secs >= 10));
};

export const getItemDuration = async (item) => {
  const trackWithAlbum = (item.type == 'track') && item.album;

  if(((item.type == 'album') || trackWithAlbum) && item.id && !item.duration_ms){
    try {
      const data = await spotify({url: `/albums/${trackWithAlbum ? item.album.id : item.id}/tracks`});
      return data.items[0].duration_ms;
    }
    catch(error){
      handleApiError('Oops, there was an issue loading some track duration information.');
      return 0;
    }
  }

  return item.duration_ms;
};

//important for isSameTrack()
export async function setDuration(item){
  item.duration_ms = await getItemDuration(item);

  if(!item.duration){
    item.duration = msToDuration(item.duration_ms);
  }        
}

const retryPlayerInit = async () => {
  try{
    await refreshToken();
    await initSpotifyPlayer(true, true);
  }
  catch(error){
    handleAuthError('Couldn\'t init player.');
  }
};

export const initSpotifyPlayer = async (transferPlayback, activationOnly) => {
  if($nuxt.$store.getters[`${SPOTIFY}/player`] && storageGet(DEVICE_ID)){
    return;
  }

  if(window.spotifyPlayer){
    window.spotifyPlayer.disconnect();
  }
  
  if(!activationOnly){
    $nuxt.$store.commit(`${SPOTIFY}/setPendingFirstPlay`, true);
  }
  
  const spotifyPlayer = new Spotify.Player({
    name: AUX_DEVICE_NAME,
    getOAuthToken: callback => {
      //https://github.com/spotify/web-playback-sdk/issues/23
      //apperently this function is called when sdk needs new token;
      //can't be async so we'll have to hope our logic has a fresh one stored
      callback(storageGet(AUTH.ACCESS_TOKEN));
    },
    volume: 1,
    enableMediaSession: true
  });

  return new Promise((resolve) => {
    spotifyPlayer.addListener('ready', async ({device_id}) => {
      $nuxt.$store.commit(`${SPOTIFY}/setPlayer`, spotifyPlayer);
      storageSet(DEVICE_ID, device_id);

      if(transferPlayback){
        await spotify({url: '/me/player', method: 'PUT', body: {
          device_ids: [device_id]
        }});
      }

      resolve();
      console.log(`Spotify player ready with device id ${device_id}`);
    });

    spotifyPlayer.on('initialization_error', message => {
      console.error('Failed to initialize', message);
      $nuxt.$store.dispatch(`${SPOTIFY}/stopPlayback`);
    });

    spotifyPlayer.on('authentication_error', async ({message}) => {
      console.error(`Unauthorized to connect with Spotify player: ${message}. Refreshing token and retrying.`);
      await retryPlayerInit();
      resolve();
    });

    spotifyPlayer.addListener('not_ready', async () => {
      console.error('Spotify player is offline...');
    });

    spotifyPlayer.addListener('autoplay_failed', () => {
      console.error('Autoplay is not allowed by the browser autoplay rules');
    });
    
    spotifyPlayer.addListener('player_state_changed', async (currentState) => {      
      if(!currentState){
        return;
      }

      //keep playing if spotify paused due to there being no next tracks in its own queue
      const spotifyPausedForNoNextTracks = currentState.paused && !currentState.track_window.next_tracks.length && currentState.position == 0;
      $nuxt.$store.commit(`${SPOTIFY}/setAudioPlaying`, spotifyPausedForNoNextTracks ? true : !currentState.paused);//needed in order to react to headphones being taken off etc.

      const auxCurrentTrack = $nuxt.$store.getters[`${SPOTIFY}/currentlyPlayingItem`];
      //console.log(auxCurrentTrack);

      const auxNextTrack = $nuxt.$store.getters[`${PLAYBACK_QUEUE}/nextTrack`];
      //console.log(auxNextTrack);

      const spotifyCurrentTrack = currentState.track_window.current_track;
      const ourNextTrackIsSpotifyCurrent = spotifyCurrentTrack && auxNextTrack ? isSameTrack(spotifyCurrentTrack, auxNextTrack) : false;

      if(!isSameTrack(auxCurrentTrack, auxNextTrack) && ourNextTrackIsSpotifyCurrent){
        console.log('Spotify moved to the correct next next track ahead of us...');
      }
    });

    spotifyPlayer.on('playback_error', ({ message }) => {
      console.error('Failed to perform playback', message);
      $nuxt.$store.commit(`${UI}/setToast`, {text: SPOTIFY_TRACK_ERROR_SKIP, error: true});
      $nuxt.$store.dispatch(`${PLAYBACK_QUEUE}/playNextTrack`);
    });

    spotifyPlayer.connect();
    window.spotifyPlayer = spotifyPlayer;
  });
};

//https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
export const shuffleArray = (array) => {
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
};

export function isSameTrack(trackA, trackB){
  if(trackA && trackB){
    const trackAName = trackA.name || trackA.primaryLabel;
    const trackBName = trackB.name || trackB.primaryLabel;

    const bothHaveName = trackAName && trackBName;
    const bothHaveUri = trackA.uri && trackB.uri;

    //not even durations can be trusted among items with same uri smh so adding uri check;
    //Dance Now by JID even seen with different uri AND duration_ms comparing our item to sdk's
    if(bothHaveUri && trackA.uri == trackB.uri){
      return true;
    }

    if(bothHaveName && trackAName == trackBName){
      return true;
    }
  }

  return false;
}

export function ignoredUsers(){
  if(process.client){
    return storageGet(IGNORED_USERS) ? storageGet(IGNORED_USERS).split(',') : [];
  }

  return [];
}

export function activityTimestamp(date, showDays){
  const now = new Date();
  const hourOrMoreAgo = differenceInHours(now, parseISO(date));

  if(hourOrMoreAgo){
    if(hourOrMoreAgo >= 24 && showDays){
      return `${differenceInDays(now, parseISO(date))}d ago`;
    }

    return `${hourOrMoreAgo}h ago`;
  }

  const minutesAgo = differenceInMinutes(now, parseISO(date));
  return `${minutesAgo < 1 ? 'just now' : `${minutesAgo}m ago`}`;
}

export async function processAlbum(album){
  if(!album.details){
    album.details = await details(album, album.id);
  }

  const albumDetails = album.details;
  let allTracksRetrieved = false;
  let duration = 0;
  let tracks = [];

  if(album.singleTrack){
    duration = msToDuration(albumDetails.albumTracks[0].duration_ms);

    //set data for 'more from artist' content
    setItemMetaData(albumDetails.artistAlbums);
    setItemMetaData(albumDetails.artistTopTracks);
    setItemMetaData(albumDetails.relatedArtists);
  }
  else{
    duration = msToDuration(albumDetails.albumTracks.reduce((total, track) => total + track.duration_ms, 0));
    tracks = setItemMetaData(albumDetails.albumTracks);

    //set image for all tracks on album
    tracks.forEach(track => track.imgUrl = album.imgUrl);
  }

  while(!allTracksRetrieved){
    if(tracks.length < albumDetails.totalAlbumTracks){
      const {items} = await spotify({url: `/albums/${album.id}/tracks?limit=${albumDetails.collectionTrackLimit}&offset=${tracks.length}`});
      tracks = [...tracks, ...setItemMetaData(items)];
    }
    else{
      allTracksRetrieved = true;
    }
  }

  //mark all album tracks as part of this album (collection)
  for(const track of tracks){
    handleItemCollection(track, album.uri);

    //needed to display track detail when clicking album track on currently playing widget;
    //can't set whole album as that causes circular JSON error
    track.album = {...album};
    delete track.album.details;
  }

  return {
    duration,
    tracks
  }
}

//https://www.30secondsofcode.org/js/s/take-until/
export const takeUntilNotATrack = (arr, fn) => {
  for (const [i, val] of arr.entries()) if (fn(val)) return arr.slice(0, i);
  return arr;
};

export const auxApiClient = axios.create({
  baseURL: process.env.BASE_URL
});