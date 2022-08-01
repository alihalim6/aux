import {httpClient, apiConfig, topItems} from './_utils';

async function myAux(req, res){
  try{
    const limit = 50;
    const accessToken = req.headers['access-token'];

    const likedTracks = await httpClient.get(`/me/tracks?limit=${limit}`, apiConfig(accessToken));
    const likedAlbums = await httpClient.get(`/me/albums?limit=${limit}`, apiConfig(accessToken));
 
    const recentlyPlayed = await await httpClient.get(`/me/player/recently-played?limit=${limit}`, apiConfig(accessToken));

    const topArtists = await topItems('artists', apiConfig(accessToken));
    const topTracks = await topItems('tracks', apiConfig(accessToken));
    const userTopItems = [...topArtists.data.items, ...topTracks.data.items];

    const { data } = await httpClient.get('/me', apiConfig(accessToken));
    const username = data.display_name;
    const profileImg = data.images[0] ? data.images[0].url : '';

    res.json({
      likedTracks: {
        items: likedTracks.data.items,
        total: likedTracks.data.total,
        limit
      },
      likedAlbums: {
        items: likedAlbums.data.items,
        total: likedAlbums.data.total,
        limit
      },
      recentlyPlayed: {
        items: recentlyPlayed.data.items
      },
      topItems: userTopItems,
      profile: {
        username,
        img: profileImg
      }
    });
  }
  catch(error){
   res.json({error: error.toString()});
  }
};

export default myAux;