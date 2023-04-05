import {httpClient, topItems} from './_utils';
import moment from 'moment';

async function myAux(){
  const limit = 50;

  try {
    const likedTracks = await httpClient.get(`/me/tracks?limit=${limit}`);
    const likedAlbums = await httpClient.get(`/me/albums?limit=${limit}`);

    const recentlyPlayed = await httpClient.get(`/me/player/recently-played?limit=${limit}`);

    const topArtists = await topItems('artists');
    const topTracks = await topItems('tracks');
    const userTopItems = [...topArtists.data.items, ...topTracks.data.items];

    const {data} = await httpClient.get('/me');
    const username = data.display_name;
    const profileImg = data.images[0] ? data.images[0].url : '';
    const userId = data.id;
    const product = data.product;

    //handle tracks that spotify categorizes as albums
    likedTracks.data.items = likedTracks.data.items.concat(likedAlbums.data.items.filter(item => item.album.total_tracks == 1));//add such tracks to likedTracks
    likedAlbums.data.items = likedAlbums.data.items.filter(item => item.album.total_tracks > 1);//remove them from likedAlbums
    likedTracks.data.items.sort((a, b) => moment(a.added_at).isBefore(moment(b.added_at)) ? 1 : -1);//sort all tracks by added date now

    return {
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
        img: profileImg,
        id: userId,
        product
      }
    };
  }
  catch(error){
    //console.error(error);
  }
};

export default myAux;