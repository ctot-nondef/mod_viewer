'use strict';

/* Filters */

GlaserApp
.filter('checkmark', function() {
  return function(input) {
    return input ? '\u2713' : '\u2718';
  };
})
.filter('hasTranslation', function() {
  return function(input) {
    return input ? '\u2713' : '\u2718';
  };
})
.filter('hasTranscription', function() {
  return function(input) {
    return input ? '\u2713' : '\u2718';
  };
})
.filter('geoGeonamesID', function() {
  return function(input) {
    return input ? '\u2713' : '\u2718';
  };
});
