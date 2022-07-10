import {httpClient, apiConfig} from './_utils';

async function playlists(req, res){
  try{
    const limit = 50;
    const accessToken = req.headers['access-token'];

    const featured = await httpClient.get(`/browse/featured-playlists?limit=${limit}`, apiConfig(accessToken));
    const myPlaylists = await httpClient.get(`/me/playlists?limit=${limit}`, apiConfig(accessToken));

    const userProfile = await httpClient.get('/me', apiConfig(accessToken));
    const displayName = userProfile.data.display_name;
    const byMe = myPlaylists.data.items.filter(playlist => playlist.owner.display_name === displayName);
    const liked = myPlaylists.data.items.filter(playlist => playlist.owner.display_name !== displayName);

    res.json({
      featured: featured.data.playlists.items,
      byMe,
      liked
    });
  }
  catch(error){
   res.json({error: error.toString()});
  }
};

export default playlists;