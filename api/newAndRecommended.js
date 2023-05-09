import {topItems, getRecommendationSeeds, getATopArtist, httpClient} from './_utils';
import {shuffleArray} from '~/utils/helpers';

const getRecommendedTracks = async (topArtists) => {
  const topTracks = await topItems('tracks');
  let recentlyPlayed = await httpClient.get('/me/player/recently-played?limit=25');
  recentlyPlayed = recentlyPlayed.data.items.map(item => item.track).filter(item => item.id);

  const seeds = getRecommendationSeeds(topArtists, {items: [...topTracks.data.items, ...recentlyPlayed]});

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
  try {
    const {data} = await httpClient.get('/browse/new-releases?limit=50');
    const newReleases = data.albums.items;

    const topArtists = await topItems('artists');
    const recommendedTracks = await getRecommendedTracks(topArtists.data);
    const recommendedAlbums = [];
    const recommendedAlbumsMax = 3;
    const recommendedArtists = await getRecommendedArtists(topArtists.data);
    const someShuffledNewReleases = shuffleArray([...newReleases].slice(0, 8));
    let tracksToRecommendAlbums = recommendedTracks.data.tracks.slice(0, recommendedAlbumsMax);

    if(tracksToRecommendAlbums.length){
      for(const track of tracksToRecommendAlbums){
        if(track.album && track.album.album_type.toLowerCase() == 'album'){
          const {data} = await httpClient.get(`/albums/${track.album.id}`);
          recommendedAlbums.push(data);
        }
      }
    }

    const allItems = [
      ...someShuffledNewReleases.map(item => ({...item, isNew: true})), 
      ...recommendedTracks.data.tracks.slice(recommendedAlbumsMax), 
      ...recommendedArtists.data.artists.slice(0, 3),
      ...recommendedAlbums
    ];

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