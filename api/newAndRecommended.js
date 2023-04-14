import {topItems, getRecommendationSeeds, getATopArtist, httpClient} from './_utils';
import {shuffleArray} from '~/utils/helpers';

const getRecommendedTracks = async (topArtists) => {
  const topTracks = await topItems('tracks');
  const seeds = getRecommendationSeeds(topArtists, topTracks.data);

  return (seeds.artists.length || seeds.tracks.length || seeds.genres.length) ?
    await httpClient.get(`/recommendations?limit=30&seed_artists=${seeds.artists}&seed_tracks=${seeds.tracks}&seed_genres=${seeds.genres}`) :
    Promise.resolve({data: {tracks: []}});
};

const getRecommendedArtists = async (topArtists) => {
  if(topArtists.items.length){
    const topArtist = await getATopArtist(topArtists);
    console.log(`top artist seed for related artists: ${topArtist.name}`);
    return await httpClient.get(`/artists/${topArtist.id}/related-artists`);
  }

  return Promise.resolve({data: {artists: []}});
};

async function newAndRecommended(){
  //TODO don't recommend if already follow an artist/like a track etc.

  try {
    const {data} = await httpClient.get('/browse/new-releases?limit=50');
    const newReleases = data.albums.items;
    let newReleasesOffset = data.albums.items.length;

    while(newReleasesOffset < data.albums.total){
      const response = await httpClient.get(`/browse/new-releases?limit=50&offset=${newReleasesOffset}`);
      newReleases.push.apply(newReleases, response.data.albums.items);
      newReleasesOffset += response.data.albums.items.length;
    }

    const topArtists = await topItems('artists');
    const recommendedTracks = await getRecommendedTracks(topArtists.data);
    const recommendedArtists = await getRecommendedArtists(topArtists.data);
    const someShuffledNewReleases = shuffleArray([...newReleases]).slice(0, 10);
    
    const allItems = [...someShuffledNewReleases.map(item => ({...item, isNew: true})), ...recommendedTracks.data.tracks, ...recommendedArtists.data.artists.slice(0, 3)];
    shuffleArray(allItems);

    return {
      allItems,
      previewItems: [...Array.from(allItems)].splice(0, 20),
      newReleases
    };
  }
  catch(error){
    console.error(error);
  }
}

export default newAndRecommended;