import express from 'express';
import newAndRecommended from '../newAndRecommended';
import playItem from '../playItem';
import details from '../details';
import artist from '../artist';
import myAux from '../myAux';
import playlists from '../playlists';
import passthru from '../passthru';

const router = express.Router();
router.use('/newAndRecommended', newAndRecommended);
router.use('/playItem', playItem);
router.use('/details', details);
router.use('/artist', artist);
router.use('/myAux', myAux);
router.use('/playlists', playlists);
router.use('/passthru', passthru);

//!TODO: add all new paths to vercel config

export default router;