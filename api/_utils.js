import axios from 'axios';
import axiosRetry from 'axios-retry';
import {refreshToken, accessTokenExpired} from '~/auth';
import {storageGet} from '~/utils/storage';
import {AUTH, DEVICE_ID, SPLASH} from '~/utils/constants';
import {UI, SPOTIFY} from '~/store/constants';
import {initSpotifyPlayer, shuffleArray} from '~/utils/helpers';

export const PLAYBACK_API_PATH = '/me/player/play';

export const httpClient = axios.create({
  baseURL: 'https://api.spotify.com/v1'
});

//sometimes this retries, sometimes my retry logic gets called, so keep this
axiosRetry(httpClient, {retries: 5});

function isPlaybackCall(config){
  return config.url.indexOf(PLAYBACK_API_PATH) > -1;
}

function isTrackRepeatCall(config){
  return config.url.indexOf('/me/player/repeat') > -1;
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
  return responseCode == 401 || responseCode.toString().indexOf('5') == 0;
}

httpClient.interceptors.response.use(async response => {
  if(response.data.error){
    if(shouldRetry(response.data.error.status)){
      retryRequest(response.config);
    }
    else{
      handleApiError(response.data.error);
      return;
    }
  }

  return response;
}, async error => {
  if(error.response && error.response.status == 404 && isPlaybackCall(error.config)){
    console.log('404 on playback...initializing new player');
    await initSpotifyPlayer(true);
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
  else if(!isTrackRepeatCall()){
    handleApiError();
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
}

function sendToSplash(){
  console.log('refresh/retry failed for playback, sending back to splash...');
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
  $nuxt.$store.dispatch(`${SPOTIFY}/stopPlayback`);
}

export const topItems = async (topType, config) => {
  return await httpClient.get(`/me/top/${topType}?limit=${topType == 'artists' ? 5 : 20}`, config);
};


//note: the artist objects in the top tracks response don't have genres; would need to use the href in there to make API call to get artist(s)
const getSeedGenres = (artists) => {
  //genres associated with artists don't seem to align with the available seed genres (/recommendations/available-genre-seeds), but we'll use them for /recommendations anyway in case there's overlap
  
  shuffleArray(artists.items);

  return artists.items.length ? artists.items[0].genres[0] : '';
};

export const getRecommendationSeeds = (artists, tracks) => {
  let seedArtists = '';
  let seedTracks = '';

  //randomize seeds
  shuffleArray(artists.items);
  shuffleArray(tracks.items);

  function addSeeds(seedObject, seeds){
    let i = 0;

    //API allows up to five seeds, so we'll do up to two for tracks/artists, and one genre
    while(i < 2){
      console.log(`seed: ${seedObject.items[i].name}`);
      seeds += seedObject.items[i].id + ',';
      i++;
    }

    return seeds;
  }

  seedArtists = addSeeds(artists, seedArtists);
  seedTracks = addSeeds(tracks, seedTracks);

  return {
    artists: seedArtists,
    tracks: seedTracks,
    genres: getSeedGenres(artists, tracks)
  };
};

export const getATopArtist = (artists) => {
  shuffleArray(artists.items);
  return artists.items[0];
};