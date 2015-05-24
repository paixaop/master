
var module = angular.module('masterControl', []);

module.directive('masterControl', function() {
    return {
      scope: {
        name: '='
      },

      // MUST GIVE FULL DIRECTORY PATH FOR THIS TO WORK!!
      templateUrl: 'client/components/control/master-control-template.ng.html',
      controller: 'masterControlController'
    };
});

module.controller('masterControlController', ['$scope', '$meteor',
  function($scope, $meteor) {
    var self = this;
    //self.control = $meteor.collection(Controls).find( { "name": $scope.name } );
    $scope.label = "works";
  }]);