import express from 'express';
import newAndRecommended from '../newAndRecommended';
import playItem from '../playItem';
import details from '../details';
import artist from '../artist';
import myAux from '../myAux';
import playlists from '../playlists';
import {httpClient, apiConfig} from '../_utils';

const router = express.Router();
router.use('/newAndRecommended', newAndRecommended);
router.use('/playItem', playItem);
router.use('/details', details);
router.use('/artist', artist);
router.use('/myAux', myAux);
router.use('/playlists', playlists);

//!TODO: add all new paths to vercel config

//direct passthru from client to Spotify
router.post('/passthru', async (req, res) => {
  try{
    const accessToken = req.headers['access-token'];
    const url = req.body.url;
    const method = req.body.method;
    const data = req.body.data;

    const response = await httpClient({...apiConfig(accessToken), url, method, data});

    res.json(response.data);
  }
  catch(error){
   res.json({error: error.toString()});
  }
});

export default router;