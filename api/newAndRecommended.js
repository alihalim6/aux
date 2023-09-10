import {topItems, getRecommendationSeeds, getATopArtist, httpClient, randomInt} from './_utils';
import {shuffleArray} from '~/utils/helpers';
import artist from './artist';

const getRecommendedTracks = async (artists, tracks) => {
  let recentlyPlayed = await httpClient.get('/me/player/recently-played?limit=10');
  recentlyPlayed = recentlyPlayed.data.items.map(item => item.track).filter(item => item.id);

  const seeds = await getRecommendationSeeds(artists, [...tracks, ...recentlyPlayed]);

  return (seeds.artists.length || seeds.tracks.length || seeds.genres.length) ?
    httpClient.get(`/recommendations?limit=20&seed_artists=${seeds.artists}&seed_tracks=${seeds.tracks}&seed_genres=${seeds.genres}&market=US`) :
    Promise.resolve({data: {tracks: []}});
};

const getRecommendedArtists = async (topArtists) => {
  if(topArtists.items.length){
    const topArtist = getATopArtist(topArtists);
    //console.log(`top artist seed for recommended artist: ${topArtist.name}`);
    return httpClient.get(`/artists/${topArtist.id}/related-artists`);
  }

  return Promise.resolve({data: {artists: []}});
};

async function newAndRecommended(userLikes){
  try {
    const topArtists = await topItems('artists');
    const topTracks = await topItems('tracks');

    const sliceLikes = (items) => {
      const randomUserLikesStart = randomInt(items.length - 1);
      const randomUserLikesEnd = randomInt(randomUserLikesStart, randomUserLikesStart + 25);
      return items.slice(randomUserLikesStart, randomUserLikesEnd);
    };

    let likedAlbumOffset = 0;
    let likedTracksOffset = 0;

    if(!userLikes){
      const albums = await httpClient.get('/me/albums?limit=1');
      likedAlbumOffset = randomInt(0, albums.data.total);

      const tracks = await httpClient.get('/me/tracks?limit=1');
      likedTracksOffset = randomInt(0, tracks.data.total);
    }

    const likedAlbums = userLikes ? sliceLikes(userLikes.albums) : (await httpClient.get(`/me/albums?offset=${likedAlbumOffset}&limit=5`)).data.items;
    const likedAlbumTracks = likedAlbums.map(item =>  item.album.tracks.items[randomInt(item.album.tracks.items.length - 1)]);

    const likedTracks = userLikes ? sliceLikes(userLikes.tracks) : (await httpClient.get(`/me/tracks?offset=${likedTracksOffset}&limit=15`)).data.items;

    const seedTracks = [...likedAlbumTracks, ...topTracks.data.items, ...likedTracks.map(like => like.track)];

    const getTrackArtist = track => {
      return track.artists[0];
    };

    const seedArtists = [
      ...topArtists.data.items, 
      ...topTracks.data.items.map(getTrackArtist), 
      ...likedTracks.map(item => getTrackArtist(item.track))
    ];

    const recommendationData = await Promise.all([
      httpClient.get('/browse/new-releases?limit=25'),
      getRecommendedTracks(seedArtists, seedTracks),
      getRecommendedArtists(topArtists.data)
    ]);
    
    const {data} = recommendationData[0];
    const someNewReleases = shuffleArray(data.albums.items).slice(0, 3);

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
    let recommendedArtist = artists[randomInt(artists.length - 1)];
    
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

    shuffleArray(allItems);

    return {
      allItems,
      previewItems: allItems.slice(0, 18),
      someNewReleases
    };
  }
  catch(error){
    //console.error(error);
  }
}

export default newAndRecommended;