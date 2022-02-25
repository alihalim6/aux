const router = require('express').Router();

router.use('/discover', require('./_discover'));

module.exports = router;