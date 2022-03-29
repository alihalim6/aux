const bodyParser = require('body-parser');
const app = require('express')();
import newAndRecommended from './newAndRecommended';

app.use(bodyParser.json())
//app.use('/api', require('./routes'));

app.use('/api/newAndRecommended', newAndRecommended);
/* app.use('/playback', require('./playback'));
app.use('/detail', require('./detail'));
app.use('/artist', require('./artist')); */

module.exports = app;