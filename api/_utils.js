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
  if(error.response.status == 404 && isPlaybackCall(error.config)){
    console.log('404 on playback...initializing new player');
    await initSpotifyPlayer();
    await retryRequest(error.config);
    return;
  }

  if(shouldRetry(error.response.status)){
    retryRequest(error.config);
  }
  else{
    handleApiError();
  }
});

async function retryRequest(config){
  console.log(config);/////
  if(!config._retry){
    config._retry = true;

    if(accessTokenExpired()){
      await attemptTokenRefresh();
    }

    console.log('retrying request...');
    return httpClient.request(config);
  }
  else if(config.response.status == '401' && isPlaybackCall(config)){
    console.log('refresh/retry failed for playback, sending back to splash...');
    $nuxt.$store.dispatch(`${SPOTIFY}/stopPlayback`);
    $nuxt.$router.replace({name: SPLASH, params: {failedRefreshRetry: true}});
  }
}

async function attemptTokenRefresh(){
  try{
    await refreshToken();
  }
  catch(error){
    $nuxt.$store.commit(`${UI}/setToast`, {text: 'Something went wrong, please refresh the page lorem ipsum...', error: true});
  }
}

export function handleApiError(message){
  $nuxt.$store.commit(`${UI}/setToast`, {text: message || 'Something went wrong lorem ipsum...', error: true});
  $nuxt.$store.dispatch(`${SPOTIFY}/stopPlayback`);
}

export const topItems = async (topType, config) => {
  return await httpClient.get(`/me/top/${topType}`, config);
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

  function addSeeds(seedObject, seed){
    let i = 0;

    seedObject.items.forEach(item => {
      //API allows up to five seeds, so we'll do up to two for tracks/artists, and one genre
      if(i === 2){
        return;
      }

      console.log(`seed: ${item.name}`);
  
      seed += item.id + ',';
      i++;
    });

    return seed;
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