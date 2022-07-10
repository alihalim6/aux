import {apiConfig, httpClient} from './_utils';

async function artist(req, res){
  try{
    const accessToken = req.headers['access-token'];
    const artist = await httpClient.get(`/artists/${req.body.itemId}`, apiConfig(accessToken));

    res.json({artist: artist.data});
  }
  catch(error){
   res.json({error: error.toString()});
  }
};

export default artist;