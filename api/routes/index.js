const router = require('express').Router();
const bodyParser = require('body-parser');

router.use(bodyParser.json());

router.use('/newAndRecommended', require('../newAndRecommended'));
router.use('/playback', require('../playback'));
router.use('/detail', require('../detail'));
router.use('/artist', require('../artist'));

module.exports = router;