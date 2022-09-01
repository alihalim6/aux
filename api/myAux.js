import {httpClient, apiConfig, topItems} from './_utils';
import moment from 'moment';

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

    //handle tracks that spotify categorizes as albums
    likedTracks.data.items = likedTracks.data.items.concat(likedAlbums.data.items.filter(item => item.album.total_tracks == 1));//add such tracks to likedTracks
    likedAlbums.data.items = likedAlbums.data.items.filter(item => item.album.total_tracks > 1);//remove them from likedAlbums
    likedTracks.data.items.sort((a, b) => moment(a.added_at).isBefore(moment(b.added_at)) ? 1 : -1);//sort all tracks by added date now

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
        name: username,
        img: profileImg
      }
    });
  }
  catch(error){
   res.json({error: error.toString()});
  }
};

export default myAux;