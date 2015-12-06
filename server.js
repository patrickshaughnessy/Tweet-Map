'use strict';

var PORT = process.env.PORT || 3000;

var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');
// var Twitter = require('twitter');
var Twitter = require('twit');


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

  var stream;

  socket.on('startFeed', function (data) {
    console.log('insidesocket', data);

    // TWITTER FEED
    var client = new Twitter({
      consumer_key: process.env.TWITTER_HTHM_KEY,
      consumer_secret: process.env.TWITTER_HTHM_SECRET,
      access_token: process.env.TWITTER_HTHM_TOKEN,
      access_token_secret: process.env.TWITTER_HTHM_TOKEN_SECRET
    });

    stream = client.stream('statuses/filter', {track: data.tag});

    stream.on('tweet', function(tweet){
      console.log(tweet);
      if (tweet.entities.media){
        if (tweet.place || tweet.user.location){
          socket.emit('tweet', tweet);
        } else {
          socket.emit('tweetNoLocation', tweet);
        }
      }
    })
  });

  socket.on('stopFeed', function(){
    stream.stop();
  })
});


// 404 HANDLER
app.use(function(req, res){
  res.status(404).render('404')
})

server.listen(PORT, function(){
  console.log('Listening on port ', PORT);
});
