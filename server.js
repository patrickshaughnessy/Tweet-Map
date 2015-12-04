'use strict';

var PORT = process.env.PORT || 3000;

var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var Twitter = require('twitter');

var app = express();

var mongoose = require('mongoose');
mongoose.connect(process.env.MONGOLAB_URI || 'mongodb://localhost/heatmap');

app.set('view engine', 'ejs');

// GENERAL MIDDLEWARE
app.use(morgan('dev'));
app.use(bodyParser.urlencoded( {extended: true} ));
app.use(bodyParser.json());

// Force HTTPS on Heroku
// app.use(function(req, res, next) {
//   var protocol = req.get('x-forwarded-proto');
//   protocol == 'https' ? next() : res.redirect('https://' + req.hostname + req.url);
// });

app.use(express.static('source'));  // change to pubic with gulp

// ROUTES
app.use('/', require('./routes/index'));
// app.use('/tweets', require('./routes/tweets'));

// SOCKET
var server = require('http').Server(app);
var io = require('socket.io')(server);


io.on('connection', function (socket) {
  // listen for start of feed
  socket.on('startFeed', function (data) {
    console.log('insidesocket', data);

    // TWITTER FEED
    var client = new Twitter({
      consumer_key: process.env.TWITTER_HTHM_KEY,
      consumer_secret: process.env.TWITTER_HTHM_SECRET,
      access_token_key: process.env.TWITTER_HTHM_TOKEN,
      access_token_secret: process.env.TWITTER_HTHM_TOKEN_SECRET
    });

    var boundingBox = `${data.location.lng - 0.65}, ${data.location.lat - 0.65}, ${data.location.lng + 0.65}, ${data.location.lat + 0.65}`
    console.log(boundingBox);

    client.stream('statuses/filter', {locations: boundingBox}, function(stream) {

        stream.on('data', function(tweet) {
          var regex = new RegExp(data.tag, 'gi');
          if (tweet.text.match(regex)){
            console.log(tweet);
            socket.emit('tweet', tweet);
          }
        });
        stream.on('error', function(error) {
          console.log(error);
          // throw error;
        });

    });

  });
});


// 404 HANDLER
app.use(function(req, res){
  res.status(404).render('404')
})

server.listen(PORT, function(){
  console.log('Listening on port ', PORT);
});
