/**
 * Created by pedro on 6/6/15.
 */
var module = angular.module('masterLabel', ['angular-meteor']);

if( typeof Controls === 'undefined') {
  Controls = new Meteor.Collection(clientConfig.controls.collection);
}

/**
 * Custom attribute directive for label elements
 */
module.directive('masterLabel', function() {
  return {
    scope: {
      masterLabel: '@'
    },

    restrict: 'A',

    // MUST GIVE FULL DIRECTORY PATH FOR THIS TO WORK!!
    //templateUrl: 'client/components/control/master-control-template.ng.html',
    controller: 'masterLabelController'

    /*link: function(scope, element, attributes) {

      scope.control = {};
      scope.control.label = "Test";
      console.log(attributes.masterLabel);

      //modelObject is a scope property of the parent/current scope
      scope.$watch(attributes.masterLabel, function(value){
        console.log(value);
      });
    }*/
  };
});

module.controller('masterLabelController', ['$scope', '$meteor',
  function($scope, $meteor) {
    var self = this;

    self.subscription = {
      ready: false
    };

    self.findAttr = $scope.masterLabel;

    // If the master-control tag has no "name" attribute generate error
    if( angular.isUndefined(self.findAttr) ) {
      throw new Error('Control is undefined. Please define the master-label attribute');
    }
    $scope.test = 'Testing';


    $scope.$meteorSubscribe(clientConfig.controls.collection,
      { name: self.findAttr }).then(function (handle) {

        console.log(self.findAttr + ': Client Controls subscription ready.');

        self.subscription = handle;

        // Get the control from the database and bind it to Angular's scope
        $scope.control = $scope.$meteorObject(Controls, { name: self.findAttr } );

        console.log(self.findAttr + ': label = ' + $scope.control.label);

        if( angular.isUndefined($scope.control) ) {
          // Control was not found so throw up and error
          throw new Error('Control ' + self.findAttr + ' was not found in database');
        }

        if (angular.isUndefined($scope.control.getRawObject().label) ) {
          throw new Error('Control label is not defined');
        }

        if( angular.isDefined($scope.control.getRawObject()) && $scope.control.getRawObject().name === self.findAttr) {
          // Object received from DB so we can initialize the controller
          //$scope.apply();
        }
      });

    function log(msg) {
      if( clientConfig.debug ) {
        console.log(self.findAttr + ':' + msg);
      }
    };

    return $scope;
  }
]);