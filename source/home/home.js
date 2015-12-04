'use strict';

angular
  .module('app')
  .controller('homeCtrl', function(socket, $scope, $http, Auth, $firebaseObject, $firebaseArray, $firebaseAuth){

    var ref = new Firebase("https://hashtag-heatmap.firebaseio.com");
    var geoFire = new GeoFire(ref);

    $scope.markers = [];
    var infoWindow = new google.maps.InfoWindow();

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
      var data = {};

      data.tag = tag;
      data.location = $scope.coords

      socket.emit('startFeed', data);
    }


    function initialize() {
      var userLoc = {}
      navigator.geolocation.getCurrentPosition(function(position){
        userLoc.lat = position.coords.latitude;
        userLoc.lng = position.coords.longitude;

        geocoder = new google.maps.Geocoder();
        var latlng = new google.maps.LatLng(userLoc.lat, userLoc.lng);
        var mapOptions = {
          zoom: 8,
          center: latlng
        }
        map = new google.maps.Map(document.getElementById("map"), mapOptions);
      });
    }

    function createMarker (loc, text, address){
      var marker = new google.maps.Marker({
          map: map,
          position: loc,
          title: address,
          animation: google.maps.Animation.DROP
      });
      marker.content = '<div class="infoWindowContent">' + text + '</div>';

      google.maps.event.addListener(marker, 'click', function(){
          infoWindow.setContent('<h2>' + marker.title + '</h2>' + marker.content);
          infoWindow.open(map, marker);
      });

      $scope.markers.push(marker);
    }

    function codeAddress(place, text) {
      var address = place;
      geocoder.geocode( { 'address': address}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          // map.setCenter(results[0].geometry.location);
          var info = results[0].geometry.location;
          createMarker(info, text, address)
        } else {
          alert("Geocode was not successful for the following reason: " + status);
        }
      });
    }


    $scope.openInfoWindow = function(e, selectedMarker){
        e.preventDefault();
        console.log(e, selectedMarker);
        google.maps.event.trigger(selectedMarker, 'click');
    }


    $scope.tweets = [];

    socket.on('tweet', function(tweet){
      $scope.tweets.push(tweet);
      codeAddress(tweet.place.full_name, tweet.text)
    })

    initialize();

    $scope.highlight = function(i){
      $scope.tweets[i]
    }


  })
