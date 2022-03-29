const router = require('express').Router();
const bodyParser = require('body-parser');

router.use(bodyParser.json());

router.use('/newAndRecommended', require('../newAndRecommended'));
router.use('/playItem', require('../playItem'));
router.use('/detail', require('../detail'));
router.use('/artist', require('../artist'));
//!TODO: add new paths to vercel config

module.exports = router;