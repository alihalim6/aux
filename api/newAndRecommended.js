import {topItems, getRecommendationSeeds, getATopArtist, httpClient, randomIntFromInterval} from './_utils';
import {shuffleArray} from '~/utils/helpers';
import artist from './artist';

const getRecommendedTracks = async (artists, tracks) => {
  let recentlyPlayed = await httpClient.get('/me/player/recently-played?limit=5');
  recentlyPlayed = recentlyPlayed.data.items.map(item => item.track).filter(item => item.id);

  const seeds = await getRecommendationSeeds(artists, [...tracks, ...recentlyPlayed]);

  return (seeds.artists.length || seeds.tracks.length || seeds.genres.length) ?
    await httpClient.get(`/recommendations?limit=25&seed_artists=${seeds.artists}&seed_tracks=${seeds.tracks}&seed_genres=${seeds.genres}&market=US`) :
    Promise.resolve({data: {tracks: []}});
};

const getRecommendedArtists = async (topArtists) => {
  if(topArtists.items.length){
    const topArtist = getATopArtist(topArtists);
    console.log(`top artist seed for recommended artist: ${topArtist.name}`);
    return await httpClient.get(`/artists/${topArtist.id}/related-artists`);
  }

  return Promise.resolve({data: {artists: []}});
};

async function newAndRecommended(){
  try {
    const newReleasesLimit = 15;
    const randomOffset = randomIntFromInterval(newReleasesLimit);

    const topArtists = await topItems('artists');
    const topTracks = await topItems('tracks');

    const likedAlbums = await httpClient.get('/me/albums?limit=10');
    const likedAlbumTracks = likedAlbums.data.items.map(item =>  item.album.tracks.items[randomIntFromInterval(item.album.tracks.items.length - 1)]);
    let likedTracks = await httpClient.get('/me/tracks?limit=25');
    
    const seedArtists = [...topArtists.data.items, ...topTracks.data.items.map(track => track.artists[0])];
    const seedTracks = [...likedAlbumTracks, ...topTracks.data.items, ...likedTracks.data.items.map(like => like.track)];

    const recommendationData = await Promise.all([
      httpClient.get(`/browse/new-releases?offset=${randomOffset}&limit=${newReleasesLimit}`),
      getRecommendedTracks(seedArtists, seedTracks),
      getRecommendedArtists(topArtists.data)
    ]);
    
    const {data} = recommendationData[0];
    const newReleases = data.albums.items;
    const someNewReleases = newReleases.slice(0, 3);

    let recommendedTracks = recommendationData[1];
    const recommendedAlbums = [];
    const recommendedAlbumsMax = 2;
    let tracksToRecommendAlbums = recommendedTracks.data.tracks.slice(0, recommendedAlbumsMax);

    if(tracksToRecommendAlbums.length){
      for(const track of tracksToRecommendAlbums.filter(track => track.album && track.album.album_type.toLowerCase() == 'album')){
        const {data} = await httpClient.get(`/albums/${track.album.id}`);
        recommendedAlbums.push(data);
      }
    }

    const artists = [...recommendationData[2].data.artists, ...recommendedTracks.data.tracks.map(track => track.artists[0])];
    let recommendedArtist = artists[randomIntFromInterval(artists.length - 1)];
    
    if(!recommendedArtist.images){
      recommendedArtist = await artist(recommendedArtist.id);
    }

    recommendedTracks = recommendedTracks.data.tracks.slice(recommendedAlbumsMax);

    let allItems = [
      ...someNewReleases.map(item => ({...item, isNew: true})), 
      ...recommendedTracks, 
      recommendedArtist,
      ...recommendedAlbums
    ];

    allItems = shuffleArray(allItems);

    return {
      allItems,
      previewItems: [...allItems].splice(0, 18),
      newReleases
    };
  }
  catch(error){
    console.error(error);
  }
}

export default newAndRecommended;