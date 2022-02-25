import express from 'express';
import {headers} from '../_utils';

const router = express.Router();

router.get('/', async (req, res) => {
  try{
    const accessToken = req.get('access-token');
    const topArtists = await topItems('artists', headers(accessToken));
    const topTracks = await topItems('tracks', headers(accessToken));
    
    res.json({
      ...topArtists.data,
      ...topTracks.data
    });
  }
  catch(error){
    res.json({});
  }
});

module.exports = router;