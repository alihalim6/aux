import axios from 'axios';
import axiosRetry from 'axios-retry';
import {refreshToken, accessTokenExpired} from '~/auth';
import {storageGet} from '~/utils/storage';
import {AUTH, DEVICE_ID, SPLASH, SPOTIFY_TRACK_ERROR_SKIP} from '~/utils/constants';
import {UI, SPOTIFY, PLAYBACK_QUEUE} from '~/store/constants';
import {initSpotifyPlayer, shuffleArray} from '~/utils/helpers';
import artist from './artist';

export const PLAYBACK_API_PATH = '/me/player/play';

export const httpClient = axios.create({
  baseURL: 'https://api.spotify.com/v1'
});

//sometimes this retries, sometimes my retry logic gets called, so keep this
axiosRetry(httpClient, {retries: 3});

function isPlaybackCall(config){
  return config && config.url.indexOf(PLAYBACK_API_PATH) > -1;
}

function ignoreError(config){
  return config && (config.url.indexOf('/me/player/repeat') > -1 || config.url.indexOf('/search') > -1);
}

httpClient.interceptors.request.use(async config => {
  if(accessTokenExpired()){
    await attemptTokenRefresh(); 
  }

  const playbackRetry = config._retry && isPlaybackCall(config);

  if(playbackRetry){
    console.log(`retrying playback request with device id ${storageGet(DEVICE_ID)}`);
  }

  return {
    ...config,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${storageGet(AUTH.ACCESS_TOKEN)}`
    },
    //ensure device id of newly authed player is used when retrying playback
    url: playbackRetry ? `${PLAYBACK_API_PATH}?device_id=${storageGet(DEVICE_ID)}` : config.url,
    timeout: 60000//1 min
  };
});

function shouldRetry(responseCode){
  return responseCode && (responseCode == 401 || responseCode.toString().indexOf('5') == 0);
}

httpClient.interceptors.response.use(async response => {
  if(response && response.data.error){
    if(shouldRetry(response.data.error.status)){
      retryRequest(response.config);
    }
    else{
      handleApiError(response.data.error);

      if(isPlaybackCall(response.config)){
        $nuxt.$store.dispatch(`${SPOTIFY}/stopPlayback`);
      }

      return;
    }
  }

  return response;
}, async error => {
  if(error.response && error.response.status == 404 && isPlaybackCall(error.config)){
    console.log('404 on playback...initializing new player');
    await initSpotifyPlayer(true, true);
    await retryRequest(error.config);
    return;
  }

  //401 on a retry
  if(error.config && error.config._retry && error.response && error.response.status == 401){
    sendToSplash();
  }
  else if(shouldRetry(error.response && error.response.status)){
    retryRequest(error.config);
  }
  else if(!ignoreError(error.config)){
    handleApiError();

    if(isPlaybackCall(error.config)){
      $nuxt.$store.dispatch(`${SPOTIFY}/stopPlayback`);
    }
  }
});

async function retryRequest(config){
  if(!config._retry){
    config._retry = true;

    if(accessTokenExpired()){
      await attemptTokenRefresh();
    }

    console.log('retrying request...');
    return httpClient.request(config);
  }
  else if(!storageGet(DEVICE_ID)){
    sendToSplash();
  }
  else if(isPlaybackCall(config)){
    $nuxt.$store.commit(`${UI}/setToast`, {text: SPOTIFY_TRACK_ERROR_SKIP, error: true});
    $nuxt.$store.dispatch(`${PLAYBACK_QUEUE}/playNextTrack`);
  }
}

function sendToSplash(){
  console.log('refresh/retry failed, sending back to splash...');
  $nuxt.$store.dispatch(`${SPOTIFY}/stopPlayback`);
  $nuxt.$router.replace({name: SPLASH, params: {failedRefreshRetry: true}});
}

async function attemptTokenRefresh(){
  try{
    await refreshToken();
  }
  catch(error){
    $nuxt.$store.commit(`${UI}/setToast`, {text: 'Something went wrong, please refresh the page.', error: true});
  }
}

export function handleApiError(message){
  $nuxt.$store.commit(`${UI}/setToast`, {text: message || 'Something went wrong!', error: true});
}

export const topItems = async (topType, limit) => {
  return await httpClient.get(`/me/top/${topType}?limit=${limit || 15}`);
};


//note: the artist objects in the top tracks response don't have genres; would need to use the href in there to make API call to get artist(s)
const getSeedGenres = async (artists) => {
  //genres associated with artists don't seem to align with the available seed genres (/recommendations/available-genre-seeds), but we'll use them for /recommendations anyway in case there's overlap

  if(!artists.length){
    return '';
  }
  
  artists = shuffleArray(artists);
  let seedArtist = artists[0];

  if(!seedArtist.genres){
    seedArtist = await artist(seedArtist.id);
  }

  return seedArtist.genres[0];
};

export const getRecommendationSeeds = async (artists, tracks) => {
  let seedArtists = '';
  let seedTracks = '';

  //randomize seeds
  artists = shuffleArray(artists);
  tracks = shuffleArray(tracks);

  function addSeeds(seedObject, seeds){
    let i = 0;

    //API allows up to five seeds, so we'll do up to two for tracks/artists, and one genre
    while(i < 2){
      console.log(`seed: ${seedObject[i].name}`);
      seeds += seedObject[i].id + ',';
      i++;
    }

    return seeds;
  }

  seedArtists = addSeeds(artists, seedArtists);
  seedTracks = addSeeds(tracks, seedTracks);
  const genres = await getSeedGenres(artists, tracks);

  return {
    artists: seedArtists,
    tracks: seedTracks,
    genres
  };
};

export const getATopArtist = (artists) => {
  return shuffleArray(artists.items)[0];
};