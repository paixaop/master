
var module = angular.module('masterControl', ['angular-meteor']);

module.directive('masterControl', function() {
    return {
      scope: {
        name: '@'
      },

      // MUST GIVE FULL DIRECTORY PATH FOR THIS TO WORK!!
      templateUrl: 'client/components/control/master-control-template.ng.html',
      controller: 'masterControlController'
    };
});

module.controller('masterControlController', ['$scope', '$meteor',
  function($scope, $meteor) {
    var self = this;

    if( angular.isUndefined($scope.name) ) {
      throw new Error('Control name is undefined. Please define the "name" attribute in <master-control>');
    }

    $scope.controls = $meteor.collection(Controls);

    var control = $meteor.object(Controls, { name: $scope.name } );
    $scope.control = control;
    $scope.label = "works";
  }]);