import axios from 'axios';

export const httpClient = axios.create({
  baseURL: 'https://api.spotify.com/v1/'
});

export const apiConfig = (accessToken) => {
  return {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    timeout: 60000//1 min
  };
};

export const topItems = async (topType, config) => {
  return await httpClient.get(`/me/top/${topType}?limit=50`, config);
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

  console.log(`arrays have been shuffled;`);

  function addSeeds(seedObject, seed){
    let i = 0;

    seedObject.items.forEach(item => {
      //API allows up to five seeds, so we'll do up to two for tracks/artists, and one genre
      if(i === 2){
        return;
      }
  
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