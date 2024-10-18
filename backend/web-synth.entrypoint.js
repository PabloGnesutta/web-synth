// TODO: DON'T USE EXPRESS! No need to.
// TODO: Use .env or something better than locals.js

const
  express = require('express'),
  config = require('./config'),
  path = require('path');

const app = express();

app.set('PORT', config.PORT);

app.use(express.static(path.join(__dirname, 'public')));
app.use('/', (req, res) => res.sendFile(__dirname + '/public/index.html'));

app.listen(app.get('PORT'), () => console.log('Server listening on port ' + app.get('PORT')));