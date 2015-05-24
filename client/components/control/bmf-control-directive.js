
var module = angular.module('bmfControl', []);

module.directive('bmfControl', function() {
    return {
      scope: {
        name: '='
      },

      templateUrl: 'bmf-control-template.ng.html',
      controller: 'BmfControlController'
    };
});

module.controller('BmfControlController', ['$scope', '$meteor',
  function($scope, $meteor) {
    var self = this;
    //self.control = $meteor.collection(Controls).find( { "name": $scope.name } );
    $scope.label = "works";
  }]);