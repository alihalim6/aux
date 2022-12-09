import {apiConfig, topItems, shuffleArray, getRecommendationSeeds, getATopArtist, httpClient} from './_utils';

let accessToken;

const getRecommendedTracks = async (topArtists) => {
  const topTracks = await topItems('tracks', apiConfig(accessToken));
  const seeds = getRecommendationSeeds(topArtists, topTracks.data);

  return (seeds.artists.length || seeds.tracks.length || seeds.genres.length) ?
    await httpClient.get(`/recommendations?limit=25&seed_artists=${seeds.artists}&seed_tracks=${seeds.tracks}&seed_genres=${seeds.genres}`, apiConfig(accessToken)) :
    Promise.resolve({data: {tracks: []}});
};

const getRecommendedArtists = async (topArtists) => {
  if(topArtists.items.length){
    const topArtist = await getATopArtist(topArtists);
    console.log(`top artist seed for related artists: ${topArtist.name}`);
    return await httpClient.get(`/artists/${topArtist.id}/related-artists`, apiConfig(accessToken));
  }

  return Promise.resolve({data: {
    artists: []
  }});
};

async function newAndRecommended(req, res){
  //TODO don't recommend if already follow an artist/like a track etc.

  try{
    accessToken = req.headers['access-token'];

    let newReleases = await httpClient.get('/browse/new-releases?limit=10', apiConfig(accessToken));
    newReleases = newReleases.data.albums.items;

    const topArtists = await topItems('artists', apiConfig(accessToken));
    const recommendedTracks = await getRecommendedTracks(topArtists.data);
    const recommendedArtists = await getRecommendedArtists(topArtists.data);
    
    const allItems = [...newReleases, ...recommendedTracks.data.tracks, ...recommendedArtists.data.artists.splice(0, 10)];
    shuffleArray(allItems);

    res.json({
      allItems,
      previewItems: [...Array.from(allItems)].splice(0, 25),
      newReleases
    });
  }
  catch(error){
   res.json({error: error.toString()});
  }
};

export default newAndRecommended;