const bodyParser = require('body-parser');
const app = require('express')();

app.use(bodyParser.json())
app.use('/api', require('./routes'));

module.exports = app;