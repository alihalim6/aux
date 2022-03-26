const router = require('express').Router();
const bodyParser = require('body-parser');

router.use(bodyParser.json());

router.use('/discover', require('./_discover'));
router.use('/playback', require('./_playback'));
router.use('/detail', require('./_detail'));

module.exports = router;