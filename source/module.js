'use strict';

angular
  .module('app', ['firebase', 'ui.router', 'satellizer', 'btford.socket-io'])
  .config(function($stateProvider, $urlRouterProvider, $authProvider) {
    $urlRouterProvider.otherwise('/');

    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: 'home/home.html',
        controller: 'homeCtrl'
      })

    //
    // $authProvider.google({
    //   clientId: '403356814232-l0l5edtnt2uamllctq4eeuflrr4t395d.apps.googleusercontent.com'
    // });
  })
  .factory("Auth", ["$firebaseAuth", function($firebaseAuth) {
      var ref = new Firebase("https://hashtag-heatmap.firebaseio.com");
      return $firebaseAuth(ref);
    }
  ])
  .factory('socket', function (socketFactory) {
    return socketFactory();
  });
