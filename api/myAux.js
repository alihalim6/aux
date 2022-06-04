import {apiConfig, topItems} from './_utils';

let accessToken;

const getUserProfile = async () => {
  return await httpClient.get('/me', apiConfig(accessToken));
};

async function myAux(req, res){
  try{
    accessToken = req.headers['access-token'];
    const { display_name } = await getUserProfile();
    const topArtists = await topItems('artists', apiConfig(accessToken));
    const topTracks = await topItems('tracks', apiConfig(accessToken));
    const topItems = [...topArtists.data, ...topTracks.data];

    res.json({
      user: { displayName: display_name},
      topItems
    });
  }
  catch(error){
    res.json({error});
  }
};

export default myAux;