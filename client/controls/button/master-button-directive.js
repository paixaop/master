/**
 * Button Control Directive
 *
 * Tag attributes
 *   * name - control name (MANDATORY)
 *   * timer - how long after does it take for the control to Button to
 *   another state
 *   * audio -
 *   * img [imgON, imgOFF, imgHELD]
 *   * states [ON, OFF, HELD]
 * @type {module|*}
 */
/* jshint -W020 */
"use strict";

var module = angular.module('masterButton', [ ]);

if (typeof Controls === 'undefined') {
  Controls = new Meteor.Collection(clientConfig.controls.collection);
}

/**
 * Custom element (tag) directive for control elements
 */
module.directive('masterButton', function () {
  return {
    scope : {
      name: '=',
      state: '='
    },
    restrict: 'AEC',
    replace: true,
    templateUrl: 'client/controls/button/master-button-template.ng.html',

    link: function(scope, elem, attrs) {
      scope.label = attrs.label;

      scope.watch('label', function(prop, newLabel, oldLabel) {
        console.log(prop + ' changed - [' + newLabel + ' , ' + oldLabel + ']');
      });

      scope.press = function() {
        console.log('Press called before: ' + scope.label);
        scope.label = "On";
        console.log('Press called after: ' + scope.label);
      };

      elem.bind('mouseover', function() {
        elem.css('cursor', 'pointer');
      });
    }
  };
});
