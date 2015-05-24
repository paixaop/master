
var module = angular.module('controlElement', [
    'angular-meteor',
    'ngMaterial',
    'ngMdIcons',
    'hmTouchEvents'
  ]);

module.directive('bmfControlElement', function() {
    return {
      scope: {
        name: '='
      },
      restrict:  'E',
      templateUrl: 'control-element-template.ng.html',
      replace: true,
      controller: 'ControlElementController',
      controllerAs: 'ctrl'
    };
});

module.controller('ControlElementController', ['$scope', '$meteor',
  function($scope, $meteor) {
    var self = this;
    self.control = $meteor.collection(Controls).find( { "name": $scope.name } );
  }]);