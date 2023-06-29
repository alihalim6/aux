import {httpClient} from './_utils';

async function playlists(){
  const limit = 50;

  try {
    const playlistsData = await Promise.all([
      httpClient.get(`/browse/featured-playlists?limit=${limit}`),
      httpClient.get(`/me/playlists?limit=${limit}`),
      httpClient.get('/me')
    ]);

    const featured = playlistsData[0];
    const myPlaylists = playlistsData[1];

    const userProfile = playlistsData[2];
    const displayName = userProfile.data.display_name;
    const byMe = myPlaylists.data.items.filter(playlist => playlist.owner.display_name === displayName);
    const liked = myPlaylists.data.items.filter(playlist => playlist.owner.display_name !== displayName);

    return {
      featured: featured.data.playlists.items,
      byMe,
      liked
    };
  }
  catch(error){
    console.error(error);
  }
};

export default playlists;