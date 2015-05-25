
var module = angular.module('masterControl', ['angular-meteor']);

/**
 * Custom element (tag) directive for control elements
 */
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

/**
 * Control Controller - sorry for the repetition. Controls the master-control tag
 */
module.controller('masterControlController', ['$scope', '$meteor',
  function($scope, $meteor) {
    var self = this;

    // If the master-control tag has no "name" attribute generate error
    if( angular.isUndefined($scope.name) ) {
      throw new Error('Control name is undefined. Please define the "name" attribute in <master-control>');
    }

    // Get the control from the database
    $scope.boundControl = $meteor.object(Controls, { name: $scope.name } );
    $scope.control = $scope.boundControl.getRawObject();

    if( angular.isUndefined($scope.control) ) {
      // Control was not found so throw up and error
      throw new Error('Control ' + $scope.name + ' was not found in database');
    }

    // Guard for double tap events
    var doubleTapGuard = false;

    // Listen for MQTT messages
    MqttMessages.find({}).observe({

      added: function(m) {
        if( m.topic ===$scope.control.mqtt.in) {
          $scope.log('MQTT message received:', item);
          $scope.message = m;
          $scope.processMessage(m.message);
        }
      }
    });

    $scope.processMessage = function (msg) {
      // message format is
      // SET <variable>=<value>
      // GET <variable>

      var m = msg.match(/^(SET|GET)/);
      if(!m) {
        $scope.log("Invalid MQTT message command. Ignoring. " + msg);
        return;
      }

      m = msg.match(/^(SET)[\s\t]*(enable|state)[\s\t]*=[\s\t]*(.+)$/);
      if(m) {
        var method   = m[1];
        var variable = m[2];
        var value    = m[3];

        if(variable === 'state') {
          if( !$scope.checkValidState(value) ) {
            $scope.log('Invalid value for state. Must be ' + Object.keys($scope.control.stateMap));
            return;
          }
         $scope.control.state = value;
        }

        if(variable === 'enable') {
          if( value !== 'false' && value !== 'true' ) {
            $scope.log('Invalid value for enable. Must be true or false');
            return;
          };
         $scope.control.enable = value;
        }
      }
      else {
        $scope.log("Invalid MQTT message. Ignoring. " + msg);
      }

      m = msg.match(/^(GET)[\s\t]*(enable|state)$/);
      if(m) {
        var method   = m[1];
        var variable = m[2];

        if(variable === 'state') {
          $scope.log('state = ' +$scope.control.state);
        }

        if(variable === 'enable') {
          $scope.log('enable = ' +$scope.control.enable);
        }
      }
      else {
        $scope.log("Invalid MQTT message. Ignoring. " + msg);
      }

    };

    $scope.checkValidState = function (state) {
      var states = Object.keys($scope.control.stateMap);
      return states.indexOf(state) !== -1;
    };

    $scope.init = function() {
      var states = Object.keys($scope.control.stateMap);
      $scope.sounds= {};

      angular.forEach(states, function(state) {
        $scope.log('init sate :' + state.toString());
        var audio = $scope.getStateObj(state).audio;
        if(audio) {
          if( audio.file ) {
            var volume = 0.5 || audio.volume;
            $scope.sounds[state] = new Howl({
              src: [audio.file],
              volume: volume,
              onend: function() {
                $scope.log('Audio ' + audio.file);
              }
            });
          } else {
            $scope.log('Audio file not defined');
          }

        }
      })
    };

    $scope.press = function () {
      $scope.log('press event');
    };

    $scope.doubletap = function () {
      $scope.log('doubletap event fired');
      doubleTapGuard = true;
    };

    $scope.press = function () {
      $scope.log('press event fired');

    };

    $scope.tap = function () {
      setTimeout(function() {
        if(!doubleTapGuard) {
          $scope.log('tap event fired');
          $scope.click();
        }
        setTimeout(function() {
          doubleTapGuard = false;
        }, HAMMER_DOUBLE_TAP_DELAY);
      }, HAMMER_SINGLE_TAP_DELAY);
    };

    $scope.replaceTags = function(str) {
      if( angular.isDefined($scope.control.name) ) {
        str = str.replace(/<NAME>/g,$scope.control.name);
      }

      if( angular.isDefined($scope.control.label) ) {
        str = str.replace(/<LABEL>/g,$scope.control.label);
      }

      if( angular.isDefined($scope.control.path) ) {
        str = str.replace(/<PATH>/g,$scope.control.path);
      }

      if( angular.isDefined($scope.control.state) ) {
        str = str.replace(/<STATE>/g, $scope.control.state);
      }
      return str;
    };

    $scope.click = function(state) {
      state = state ||$scope.control.state;
      var nextState = $scope.getStateObj(state).next_state;

      // Check is Next State is set
      if( angular.isUndefined(nextState) ) {
        throw new Error('next_state undefined for state ' + $scope.control.state);
      }

      // Check if next state exists in the state map
      if( angular.isUndefined($scope.control.stateMap[nextState]) ) {
        throw new Error('next_state does not exist in state_map for state ' + $scope.control.state);
      }

      // We're good lets move to next_state
      $scope.control.state = nextState;
      $scope.checkAndSetTimer();
      $scope.playAudio();
      $scope.playTTS();
    };

    $scope.checkAndSetTimer = function() {
      // Check for timers
      var timer = $scope.getStateObj().timer;

      // If a timer is already on lets clear it first
      if( $scope.timer ) {
        clearTimeout($scope.timer);
      }

      if( timer ) {
        if( timer.delay ) {
          if( typeof timer.next_state !== 'undefined') {

            $scope.log('Set timer: ' + timer.delay + 's Next state:' + timer.next_state);

            $scope.timer = setTimeout(function () {
              $scope.click(timer.next_state);
              $scope.log('Timer fired, setting state:' +$scope.control.state);
              $scope.$apply();
            }, timer.delay);

          }
          else {
            $scope.log('timer next_state not defined');
          }
        }
        else {
          $scope.log('timer delay not defined');
        }
      }
    };

    $scope.actionAudio = function(action) {
      var audio = $scope.sounds[$scope.control.state];

      if( audio ) {
        audio.play();
      }
    };

    $scope.actionTTS = function(action) {

      var tts = $scope.getStateObj().tts;

      if( angular.isUndefined(tts) ) {
        return;
      }

      var msg = $scope.replaceTags(tts.msg);

      var text = new SpeechSynthesisUtterance(msg);
      window.speechSynthesis.speak(text);
    };

    $scope.actionHttp = function (action) {

    };

    $scope.actionMqtt = function (action) {

    };

    $scope.log = function(msg) {
      console.log($scope.control.name + ':' + msg);
    };

    $scope.getStateObj = function(state){
      state = state ||$scope.control.state;

      if( angular.isUndefined($scope.control.stateMap[state])) {
        throw new Error($scope.name + ' bad control state:' + state);
      }

      return $scope.control.stateMap[state];
    };

    $scope.getLabel = function() {
      return $scope.control.label;
    };

    $scope.getName = function() {
      return $scope.control.name;
    };

    $scope.buttonAction = function() {
      alert('Button clicked');
    };

    $scope.getImage = function() {
      return $scope.control.stateMap[$scope.control.state].image;
    };

    // Initialize Controller
    $scope.init();
    
  }]);