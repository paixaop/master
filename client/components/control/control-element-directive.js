angular.module('controlElement', [
  'angular-meteor',
  'ngMaterial',
  'ngMdIcons',
  'hmTouchEvents'
])
  .directive('controlElement', function() {
    return {
      scope: {
        name: '='
      },
      templateUrl: 'control-element-template.ng.html',
      replace: false,
      controller: 'ControlElementController',
      controllerAs: 'ctrl'
    };
  })
  .controller('ControlElementController', function($scope, $meteor) {
    var self = this;
    self.control = $meteor.collection(Controls).find( { "name": $scope.name } );

  });