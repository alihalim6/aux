import express from 'express';
import {apiConfig, topItems} from './_utils';

const router = express.Router();

async function myAux(req, res){
  try{
    const accessToken = req.headers['access-token'];
    const topArtists = await topItems('artists', apiConfig(accessToken));
    const topTracks = await topItems('tracks', apiConfig(accessToken));

    res.json({
      ...topArtists.data,
      ...topTracks.data
    });
  }
  catch(error){
    res.json({error});
  }
};

router.get('/', myAux);

if(process.env.NODE_ENV === 'development'){
  module.exports = router;
}    

export default myAux;