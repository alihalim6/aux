import {topItems, getRecommendationSeeds, getATopArtist, httpClient} from './_utils';
import {shuffleArray} from '~/utils/helpers';
import artist from './artist';
import search from './search';

const getRecommendedTracks = async (artists, tracks) => {
  let recentlyPlayed = await httpClient.get('/me/player/recently-played?limit=10');
  recentlyPlayed = recentlyPlayed.data.items.map(item => item.track).filter(item => item.id);

  const seeds = await getRecommendationSeeds(artists, [...tracks, ...recentlyPlayed]);

  return (seeds.artists.length || seeds.tracks.length || seeds.genres.length) ?
    await httpClient.get(`/recommendations?limit=23&seed_artists=${seeds.artists}&seed_tracks=${seeds.tracks}&seed_genres=${seeds.genres}&market=US`) :
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
    const newReleasesLimit = 15;
    const randomOffset = Math.floor(Math.random() * (newReleasesLimit - 0 + 1) + 0);

    const topArtists = await topItems('artists');
    const topTracks = await topItems('tracks');
    const likedAlbums = await httpClient.get('/me/albums?limit=15');
    const likedAlbumTracks = likedAlbums.data.items.map(item => shuffleArray(item.album.tracks.items)[0]);
    const seedTracks = [...likedAlbumTracks, ...topTracks.data.items];
    const seedArtists = [...topArtists.data.items, ...topTracks.data.items.map(track => track.artists[0])];

    const recommendationData = await Promise.all([
      httpClient.get(`/browse/new-releases?offset=${randomOffset}&limit=${newReleasesLimit}`),
      getRecommendedTracks(seedArtists, seedTracks),
      getRecommendedArtists(topArtists.data)
    ]);
    
    const {data} = recommendationData[0];
    const newReleases = data.albums.items;
    const someShuffledNewReleases = shuffleArray(newReleases.slice(0, 3));

    let recommendedTracks = recommendationData[1];
    const recommendedAlbums = [];
    const recommendedAlbumsMax = 2;
    let tracksToRecommendAlbums = recommendedTracks.data.tracks.slice(0, recommendedAlbumsMax);

    if(tracksToRecommendAlbums.length){
      for(const track of tracksToRecommendAlbums){
        if(track.album && track.album.album_type.toLowerCase() == 'album'){
          const {data} = await httpClient.get(`/albums/${track.album.id}`);
          recommendedAlbums.push(data);
        }
      }
    }

    const recommendedArtists = shuffleArray([...recommendationData[2].data.artists, ...recommendedTracks.data.tracks.map(track => track.artists[0])]);
    let recommendedArtist = recommendedArtists[0];
    
    if(!recommendedArtist.imgaes){
      recommendedArtist = await artist(recommendedArtists[0].id);
    }

    recommendedTracks = recommendedTracks.data.tracks.slice(recommendedAlbumsMax);

    recommendedTracks = recommendedTracks.filter(track => {
      if(track.restrictions){
        console.log('filtering out ' + track.name);
        console.log(track.restrictions);
      }
      
      return !track.restrictions;
    });

    let allItems = [
      ...someShuffledNewReleases.map(item => ({...item, isNew: true})), 
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