/**
 * Created by pedro on 6/25/15.
 */
var module = angular.module('masterDrag', ['angular-meteor']);

//module.directive('masterDrag', ['$rootScope', function($rootScope) {
module.directive('masterDrag', function() {
    return {
        restrict: 'A',
        scope: {
            slider: '='
        },
        link: function(scope, el, attrs) {
            if(!attrs.masterDrag) {
                return;
            }

            scope.slider = {};
            scope.slider.center = el.height()/2;
            console.log('->Value: ' + scope.masterValue);

            if( !attrs.masterScaleElement ) {
                scope.slider.scaleH = el.parent().height();
                scope.slider.scaleTop = el.parent().offset().top;
            }
            else {
                scope.slider.scaleH = $("#" + attrs.masterScaleElement).height();
                scope.slider.scaleTop = $("#" + attrs.masterScaleElement).offset().top;
            }

            // calculate position
            scope.$watch('slider.value', function(newValue, oldValue) {
                if (typeof newValue !== 'undefined')
                    el.css({top: (1 - scope.slider.value/100) * scope.slider.scaleH + scope.slider.scaleTop - scope.slider.center});
            }, true);

            el.draggable({
                axis: "y",
                containment:[0, scope.slider.scaleTop - scope.slider.center,
                             0, scope.slider.scaleTop + scope.slider.scaleH - scope.slider.center],
                start: function() {
                    scope.slider.startPos = el.position().top;
                },
                drag: function() {
                    scope.slider.value = Math.round(
                        100 * (1 - (el.offset().top - scope.slider.scaleTop + scope.slider.center) / scope.slider.scaleH)
                    );
                    scope.masterValue = scope.slider.value;
                    scope.$apply();
                },
                stop: function() {
                    var stopPos = el.offset().top;
                    scope.slider.dir = scope.slider.startPos > stopPos? "UP" : "DOWN";
                    var oldValue = scope.slider.value;
                    scope.slider.value = Math.round(
                        100 * (1 - (el.offset().top - scope.slider.scaleTop + scope.slider.center) / scope.slider.scaleH)
                    );
                    scope.masterValue = scope.slider.value;
                    scope.$apply();
                }
            });
            console.log('master-drag directive linked');
        }
        //controller: 'masterDragController'
    }
});

module.controller('masterDragController', ['$scope', '$meteor',
    function ($scope, $meteor) {
        var self = this;

        $scope.slider = {
            value: 60
        };

        console.log('MasterDrag Controller setup!');
        console.log($scope.slider);
    }]);

module.filter('pad', function () {
    return function (input) {
        var n = input;
        if(!n) return '';
        return (n < 10) ? '00' + n : (n < 100) ? '0' + n : '' + n;
    }
});