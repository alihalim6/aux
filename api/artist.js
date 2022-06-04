import {apiConfig, httpClient} from './_utils';

let accessToken;

const getArtist = async (itemId) => {
  return await httpClient.get(`/artists/${itemId}`, apiConfig(accessToken));
};

async function artist(req, res){
  try{
    accessToken = req.headers['access-token'];
    const artist = await getArtist(req.body.itemId);

    res.json({artist: artist.data});
  }
  catch(error){
    res.json({error});
  }
};

export default artist;