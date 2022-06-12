import {httpClient, apiConfig, topItems} from './_utils';

let accessToken;
const likesLimit = 50;

const getLikedTracks = async () => {
  return await httpClient.get(`/me/tracks?limit=${likesLimit}`, apiConfig(accessToken));
};

const getLikedAlbums = async () => {
  return await httpClient.get(`/me/albums?limit=${likesLimit}`, apiConfig(accessToken));
};

const getRecentlyPlayedItems = async () => {
  return await httpClient.get('/me/player/recently-played?limit=50', apiConfig(accessToken));
};

async function myAux(req, res){
  try{
    accessToken = req.headers['access-token'];

    const likedTracks = await getLikedTracks();
    const likedAlbums = await getLikedAlbums();
 
    const recentlyPlayed = await getRecentlyPlayedItems();

    const topArtists = await topItems('artists', apiConfig(accessToken));
    const topTracks = await topItems('tracks', apiConfig(accessToken));
    const userTopItems = [...topArtists.data.items, ...topTracks.data.items];

    res.json({
      likedTracks: {
        items: likedTracks.data.items,
        total: likedTracks.data.total,
        limit: likesLimit
      },
      likedAlbums: {
        items: likedAlbums.data.items,
        total: likedAlbums.data.total,
        limit: likesLimit
      },
      recentlyPlayed: {
        items: recentlyPlayed.data.items
      },
      topItems: userTopItems
    });
  }
  catch(error){
    res.json({error});
  }
};

export default myAux;