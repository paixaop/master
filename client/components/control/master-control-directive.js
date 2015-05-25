
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

    // Get the control from the database and bind it to Angular's scope
    $scope.control = $meteor.object(Controls, { name: $scope.name } );

    // Get the actual object without the angular wrapping
    self.control = $scope.boundControl.getRawObject();

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
          self.log('MQTT message received:', item);
          $scope.message = m;
          $scope.processMessage(m.message);
        }
      }
    });

    self.processMessage = function (msg) {
      // message format is
      // SET <variable>=<value>
      // GET <variable>

      var m = msg.match(/^(SET|GET)/);
      if(!m) {
        self.log("Invalid MQTT message command. Ignoring. " + msg);
        return;
      }

      m = msg.match(/^(SET)[\s\t]*(enable|state)[\s\t]*=[\s\t]*(.+)$/);
      if(m) {
        var method   = m[1];
        var variable = m[2];
        var value    = m[3];

        if(variable === 'state') {
          if( !self.checkValidState(value) ) {
            self.log('Invalid value for state. Must be ' + Object.keys(self.control.stateMap));
            return;
          }
         $scope.control.state = value;
        }

        if(variable === 'enable') {
          if( value !== 'false' && value !== 'true' ) {
            self.log('Invalid value for enable. Must be true or false');
            return;
          };
         $scope.control.enable = value;
        }
      }
      else {
        self.log("Invalid MQTT message. Ignoring. " + msg);
      }

      m = msg.match(/^(GET)[\s\t]*(enable|state)$/);
      if(m) {
        var method   = m[1];
        var variable = m[2];

        if(variable === 'state') {
          self.log('state = ' + $scope.control.state);
        }

        if(variable === 'enable') {
          self.log('enable = ' + $scope.control.enable);
        }
      }
      else {
        self.log("Invalid MQTT message. Ignoring. " + msg);
      }

    };

    self.checkValidState = function (state) {
      var states = Object.keys(self.control.stateMap);
      return states.indexOf(state) !== -1;
    };

    self.init = function() {
      var states = Object.keys(self.control.stateMap);
      self.sounds= {};

      angular.forEach(states, function(state) {
        self.log('init sate :' + state.toString());
        var audio = self.getStateObj(state).audio;
        if(audio) {
          if( audio.file ) {
            var volume = 0.5 || audio.volume;
            self.sounds[state] = new Howl({
              src: [audio.file],
              volume: volume,
              onend: function() {
                self.log('Audio ' + audio.file);
              }
            });
          } else {
            self.log('Audio file not defined');
          }

        }
      })
    };

    self.replaceTags = function(str) {
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


    $scope.press = function () {
      self.log('press event');
    };

    $scope.doubletap = function () {
      self.log('doubletap event fired');
      doubleTapGuard = true;
    };

    $scope.press = function () {
      self.log('press event fired');

    };

    $scope.tap = function () {
      setTimeout(function() {
        if(!doubleTapGuard) {
          self.log('tap event fired');
          $scope.click();
        }
        setTimeout(function() {
          doubleTapGuard = false;
        }, HAMMER_DOUBLE_TAP_DELAY);
      }, HAMMER_SINGLE_TAP_DELAY);
    };
    
    $scope.click = function(state) {
      state = state ||$scope.control.state;
      var nextState = self.getStateObj(state).next_state;

      // Check is Next State is set
      if( angular.isUndefined(nextState) ) {
        throw new Error('next_state undefined for state ' + $scope.control.state);
      }

      // Check if next state exists in the state map
      if( angular.isUndefined(self.control.stateMap[nextState]) ) {
        throw new Error('next_state does not exist in state_map for state ' + $scope.control.state);
      }

      // We're good lets move to next_state
      $scope.control.state = nextState;
      self.checkAndSetTimer();
      $scope.playAudio();
      $scope.playTTS();
    };

    self.checkAndSetTimer = function() {
      // Check for timers
      var timer = self.getStateObj().timer;

      // If a timer is already on lets clear it first
      if( self.timer ) {
        clearTimeout(self.timer);
      }

      if( timer ) {
        if( timer.delay ) {
          if( typeof timer.next_state !== 'undefined') {

            self.log('Set timer: ' + timer.delay + 's Next state:' + timer.next_state);

            self.timer = setTimeout(function () {
              $scope.click(timer.next_state);
              self.log('Timer fired, setting state:' + $scope.control.state);
              $scope.$apply();
            }, timer.delay);

          }
          else {
            self.log('timer next_state not defined');
          }
        }
        else {
          self.log('timer delay not defined');
        }
      }
    };

    self.actionAudio = function() {
      var audio = self.sounds[$scope.control.state];

      if( audio ) {
        audio.play();
      }
    };

    self.actionTTS = function() {

      var tts = self.getStateObj().tts;

      if( angular.isUndefined(tts) ) {
        return;
      }

      var msg = $scope.replaceTags(tts.msg);

      var text = new SpeechSynthesisUtterance(msg);
      window.speechSynthesis.speak(text);
    };

    self.actionHttp = function () {

    };

    self.actionMqtt = function () {

    };

    self.log = function(msg) {
      console.log($scope.control.name + ':' + msg);
    };

    self.getStateObj = function(state){
      state = state || $scope.control.state;

      if( angular.isUndefined(self.control.stateMap[state])) {
        throw new Error($scope.name + ' bad control state:' + state);
      }

      return self.control.stateMap[state];
    };

    $scope.getLabel = function() {
      return $scope.control.label;
    };


    $scope.getImage = function() {
      return self.control.stateMap[$scope.control.state].image;
    };

    // Initialize Controller
    self.init();
    
  }]);