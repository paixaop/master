/**
 * Created by pedro on 5/18/15.
 */

angular.module(Meteor.settings.angular.app_name,
  ['angular-meteor',
   'ngMaterial',
   'ngMdIcons',
   'hmTouchEvents',
   'masterControl']);

/*
angular.module(Meteor.settings.angular.app_name).controller("PartiesListController",
  ['$scope', '$meteor', '$mdSidenav', '$mdBottomSheet', 'controlElement',

  function($scope, $meteor, $mdSidenav, $mdBottomSheet){

    $scope.name = "World";

    $scope.parties = $meteor.collection(Parties);

    $scope.remove = function(party){
      $scope.parties.remove(party);
    };

    $scope.removeAll = function(){
      $scope.parties.remove();
    };

    $scope.toggleSidenav = function(menuId) {
      $mdSidenav(menuId).toggle();
    };

    $scope.buttonLabel = 'Click me';

    $scope.buttonAction = function() {
      alert('Button clicked');
    };

    $scope.openBottomSheet = function() {
      $mdBottomSheet.show({
        template: '<md-bottom-sheet><ng-md-icon class="md-warn" icon="warning"></ng-md-icon>Office Window opened!</md-bottom-sheet>'
      });
    };

  }]);
*/