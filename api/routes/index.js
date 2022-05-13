const router = require('express').Router();

router.use('/newAndRecommended', require('../newAndRecommended'));
router.use('/playItem', require('../playItem'));
router.use('/details', require('../details'));
router.use('/artist', require('../artist'));
//!TODO: add all new paths to vercel config

module.exports = router;