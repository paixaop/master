
var module = angular.module('bmfControl', [
    'angular-meteor',
    'ngMaterial',
    'ngMdIcons',
    'hmTouchEvents'
  ]);

module.directive('bmfControl', function() {
    return {
      scope: {
        name: '='
      },
      restrict:  'E',
      templateUrl: 'bmf-control-template.ng.html',
      controller: 'BmfControlController'
    };
});

module.controller('BmfControlController', ['$scope', '$meteor',
  function($scope, $meteor) {
    var self = this;
    //self.control = $meteor.collection(Controls).find( { "name": $scope.name } );
  }]);