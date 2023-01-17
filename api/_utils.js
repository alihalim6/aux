import axios from 'axios';
import axiosRetry from 'axios-retry';
import {refreshToken, accessTokenExpired} from '~/auth';
import {storageGet} from '~/utils/storage';
import {AUTH} from '~/utils/constants';
import {UI, SPOTIFY} from '~/store/constants';

//TODO: make into class that is instantiated with config/token and just use class method that makes calls internally using token property
export const httpClient = axios.create({
  baseURL: 'https://api.spotify.com/v1'
});

httpClient.interceptors.request.use(async config => {
  if(accessTokenExpired()){
    await attemptTokenRefresh(); 
  }
    
  return {
    ...config,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${storageGet(AUTH.ACCESS_TOKEN)}`
    },
    timeout: 60000//1 min
  };
});

httpClient.interceptors.response.use(async response => {
  if(response.data.error){
    handleApiError();
    return;
  }

  return response;
}, () => {
  handleApiError();
});

async function attemptTokenRefresh(){
  try{
    await refreshToken();
  }
  catch(error){
    $nuxt.$store.commit(`${UI}/setToast`, {text: 'Something went wrong, please refresh the page lorem ipsum...', error: true});
  }
}

axiosRetry(httpClient, {retries: 2});

export function handleApiError(){
  $nuxt.$store.commit(`${UI}/setToast`, {text: 'Something went wrong lorem ipsum...', error: true});
  $nuxt.$store.dispatch(`${SPOTIFY}/stopPlayback`);
}

export const topItems = async (topType, config) => {
  return await httpClient.get(`/me/top/${topType}`, config);
};

//https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
export const shuffleArray = (array) => {
  for(let i = array.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

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