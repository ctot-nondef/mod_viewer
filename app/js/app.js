'use strict';

/* App Module */

var GlaserApp = angular.module('GlaserApp', [
  'ui.router',
  'ngAnimate',
  'ngSanitize',
  'ngMaterial',
  'md.data.table',
  'material.components.expansionPanels',
  'ui-leaflet',
  'ngTEI',
  'AdlibServices',
  'GeoNamesServices',
  'ZoteroService',
  'ExistService',
  'angular-preload-image',
  'imageViewer'
]);


GlaserApp.config(config);
function config($stateProvider, $urlRouterProvider, $locationProvider, $compileProvider,$logProvider,$mdThemingProvider){
  $compileProvider.debugInfoEnabled(true);
  $logProvider.debugEnabled(false);
  $urlRouterProvider.otherwise('/');
    $stateProvider
    /////////////////
    // start state //
    /////////////////
    .state('start',{
        url: '/',
        views: {
            'navbar': {
                templateUrl: 'partials/navbar.html',
                controller: 'GlaserNav'
            },
            'content@': {
                templateUrl: 'partials/start.html',
                controller: 'GlaserStartList'
            }
        }
    })
    ////////////////////////////////////////////
    // root  state - only invokes navbar      //
    ////////////////////////////////////////////
    .state('gl',{
        url: '/gl',
        views: {
            'navbar': {
                templateUrl: 'partials/navbar.html',
                controller: 'GlaserNav'
            }
        },
    })
    ////////////////////////////////////////////////////////
    // various content states, views ref to index.html    //
    ////////////////////////////////////////////////////////
    .state('gl.search',{
        url: '/search',
        views: {
            'content@': {
                templateUrl: 'partials/simplesearch.html',
                controller: 'GlaserSearch'
            }
        }
    })
    .state('gl.results',{
        url: '/results',
        views: {
            'content@': {
                templateUrl: 'partials/result.html',
                controller: 'GlaserResultList'
            }
        }
    })
    .state('gl.singleRecord',{
        url: '/rec/:refID',
        views: {
            'content@': {
                templateUrl: 'partials/singleRecord.html',
                controller: 'GlaserSingleRecord'
            }
        }
    })
    .state('gl.fullImage',{
        url: '/img/:imgID',
        views: {
            'content@': {
                templateUrl: 'partials/fullImage.html',
                controller: 'GlaserImage'
            }
        }
    })
    .state('gl.about',{
        url: '/about',
        views: {
            'content@': {
                templateUrl: 'partials/about.html',
                controller: 'GlaserAbout'
            }
        }
    })
    $locationProvider.html5Mode(true);
    $mdThemingProvider.theme('default')
        .primaryPalette('blue', {
          'default': '800',
          'hue-1': '600',
          'hue-2': '700',
          'hue-3': 'A200'
        })
        .accentPalette('red', {
          'default': '800'
        });
}
