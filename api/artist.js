import express from 'express';
import {apiConfig, httpClient} from './_utils';

const router = express.Router();
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

router.post('/', artist);

if(process.env.NODE_ENV === 'development'){
  module.exports = router;
}    

export default artist;