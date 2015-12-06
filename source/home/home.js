'use strict';

angular
  .module('app')
  .controller('homeCtrl', function(socket, $scope, $http, Auth, $firebaseObject, $firebaseArray, $firebaseAuth){

    $scope.noPicture = false;
    $scope.noLocation = false;
    $scope.streaming = false;


    var ref = new Firebase("https://hashtag-heatmap.firebaseio.com");
    var geoFire = new GeoFire(ref);

    $scope.markers = [];
    var infoWindow = new google.maps.InfoWindow({disableAutoPan: true});

    var geocoder;
    var map;

    $scope.auth = Auth;

    // any time auth status updates, add the user data to scope
    $scope.auth.$onAuth(function(authData) {
      console.log('logged in with', authData);
      $scope.authData = authData;
      $scope.profileLoc = authData.twitter.cachedUserProfile.location

      var address = authData.twitter.cachedUserProfile.location
      geocoder = new google.maps.Geocoder();
      geocoder.geocode( { 'address': address}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          $scope.coords = results[0].geometry.location;
        } else {
          alert("Geocode was not successful for the following reason: " + status);
        }
      })
    });

    $scope.login = function(){
      ref.authWithOAuthPopup("twitter", function(error, authData) {
        if (error) {
          console.log("Login Failed!", error);
        } else {
          console.log("Authenticated successfully with payload:", authData);
        }
      });
    }

    $scope.logout = function(){
      ref.unauth();
      console.log('logged out')
    }

    $scope.greet = "Input a hashtag below";
    $scope.tag = '';

    var params = {
      oauth_consumer_key: 'mNSY8MEUDNdGGaIgrQTriaDLi',
      oauth_nonce: 'nonce'
    }

    $scope.getTweets = function(tag){

      $scope.streaming = true;

      var data = {};

      data.tag = tag;
      data.location = $scope.coords;
      data.noLocation = $scope.noLocation;
      data.noPicture = $scope.noPicture;

      $scope.tag = tag;

      socket.emit('startFeed', data);
    }

    $scope.stopTweets = function(){
      socket.emit('stopFeed');
      $scope.streaming = false;
    }


    function initialize() {
      var userLoc = {}
      navigator.geolocation.getCurrentPosition(function(position){
        userLoc.lat = position.coords.latitude;
        userLoc.lng = position.coords.longitude;

        geocoder = new google.maps.Geocoder();
        // var latlng = new google.maps.LatLng(userLoc.lat, userLoc.lng);
        var latlng = new google.maps.LatLng(37.979878, -98.111953)
        var mapOptions = {
          zoom: 3,
          center: latlng,
          scrollwheel: false
          // navigationControl: false,
          // mapTypeControl: false,
          // scaleControl: false,
          // draggable: false
        }
        map = new google.maps.Map(document.getElementById("map"), mapOptions);
      });
    }

    function createMarker (loc, text, address, pic, tweet){
      var marker = new google.maps.Marker({
          map: map,
          position: loc,
          title: address,
          animation: google.maps.Animation.DROP
      });
      marker.content = `
        <div class="infoWindowContent">
          <a href="https://twitter.com/${tweet.user.screen_name}" target="_blank">
            ${tweet.user.screen_name}
          </a>
          <p>
            ${text}
          </p>
          <img class="infoWindowPic" src="${pic}">
        </div>`;

      google.maps.event.addListener(marker, 'click', function(){
          infoWindow.setContent('<h2>' + marker.title + '</h2>' + marker.content);
          infoWindow.open(map, marker);
      });

      $scope.markers.push(marker);
      $scope.tweets.push(tweet);
    }

    function codeAddress(place, text, pic, tweet) {
      var address = place;
      geocoder.geocode( { 'address': address}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          // map.setCenter(results[0].geometry.location);
          var info = results[0].geometry.location;
          createMarker(info, text, address, pic, tweet)
        } else {
          console.log("Geocode was not successful for the following reason: " + status);
        }
      });
    }


    $scope.openInfoWindow = function(e, selectedMarker){
        e.preventDefault();
        console.log(e, selectedMarker);
        google.maps.event.trigger(selectedMarker, 'click');
    }


    $scope.tweets = [];
    $scope.tweetsNoLocation = [];

    socket.on('tweet', function(tweet){
      console.log(tweet.entities.media[0].media_url)
      var place = tweet.place ? tweet.place.full_name : tweet.user.location
      codeAddress(place, tweet.text, tweet.entities.media[0].media_url, tweet)
    })
    socket.on('tweetNoLocation', function(tweet){
      $scope.tweetsNoLocation.push(tweet);
    })

    initialize();

    $scope.highlight = function(i){
      $scope.tweets[i]
    }


  })
