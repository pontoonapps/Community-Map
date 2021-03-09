const express = require('express');
const request = require('request');
const app = express();
app.use('/', express.static('./dir/', {index: 'index.html', extensions: ['HTML'] }));

app.get('/details/', (req, res) => {
  request(`https://pontoonapps.com/community-api/v2/login?apiKey=4F9694E1-3AB8-4992-8B3E-C5C6B26412CD`, function (error, response, body) {
    console.error('error:', error);
    console.log('status code:', response && response.statusCode);
    console.log('body:', body);
    return res.json(JSON.parse(body));
  });
});


app.get('/test/', (req, res) => {
  request('https://pontoonapps.com/community-api/v2/?apiKey=4F9694E1-3AB8-4992-8B3E-C5C6B26412CD', function (error, response, body) {
    console.error('error:', error);
    console.log('status code:', response && response.statusCode);
    console.log('body:', body);
    return res.json(JSON.parse(body));
  });
});


app.listen(8080, () => {
  console.log('Server running')
});
