import {httpClient} from './_utils';

async function playlists(){
  const limit = 50;

  try {
    const featured = await httpClient.get(`/browse/featured-playlists?limit=${limit}`);
    const myPlaylists = await httpClient.get(`/me/playlists?limit=${limit}`);

    const userProfile = await httpClient.get('/me');
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
    //console.error(error);
  }
};

export default playlists;