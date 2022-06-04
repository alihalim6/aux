import express from 'express';
import newAndRecommended from '../newAndRecommended';
import playItem from '../playItem';
import details from '../details';
import artist from '../artist';

const router = express.Router();
router.use('/newAndRecommended', newAndRecommended);
router.use('/playItem', playItem);
router.use('/details', details);
router.use('/artist', artist);
//!TODO: add all new paths to vercel config

export default router;