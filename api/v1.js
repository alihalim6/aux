const bodyParser = require('body-parser');
const app = require('express')();

app.use(bodyParser.json())
app.use('/v1', require('./routes'));

module.exports = app;