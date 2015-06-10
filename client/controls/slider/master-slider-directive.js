/**
 * Created by pedro on 6/6/15.
 */
var module = angular.module('masterSlider', ['angular-meteor']);

if( typeof Controls === 'undefined') {
  Controls = new Meteor.Collection(clientConfig.controls.collection);
}

/**
 * Custom attribute directive for label elements
 */
module.directive('masterSlider', function() {
  return {
    scope: {
      name: '@'
    },

    restrict: 'E',

    // MUST GIVE FULL DIRECTORY PATH FOR THIS TO WORK!!
    templateUrl: 'client/controls/slider/master-slider-template.ng.html',
    controller: 'masterSliderController'

  };
});

module.controller('masterSliderController', ['$scope', '$meteor',
  function($scope, $meteor) {
    var self = this;

    self.subscription = {
      ready: false
    };

    self.control = new Control($scope, $scope.name);

    // Subscribe to controls collection and monitor changes in the
    // in the document
    self.control.subscribeDB(clientConfig.controls.collection);

    return $scope;
  }
]);