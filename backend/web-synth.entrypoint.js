const
  express = require('express'),
  config = require('./config'),
  path = require('path');

const app = express()

app.set('port', config.PORT)

app.use(express.static(path.join(__dirname, 'public')));
app.use('/', (req, res) => res.sendFile(__dirname + '/public/index.html'));

app.listen(app.get('port'), () => {
  console.log('Server listening on port ' + app.get('port'));
});