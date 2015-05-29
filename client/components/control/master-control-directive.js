
var module = angular.module('masterControl', ['angular-meteor']);
Controls = new Meteor.Collection(Meteor.settings.controls.collection);

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
    
    self.stateTimer = 0;
    
    self.subscription = {
      ready: false
    };
    
    // Guard for double tap events
    self.doubleTapGuard = false;

    // If the master-control tag has no "name" attribute generate error
    if( angular.isUndefined($scope.name) ) {
      throw new Error('Control name is undefined. Please define the "name" attribute in <master-control>');
    }

    $scope.$meteorSubscribe(Meteor.settings.controls.collection,
                            { name: $scope.name }).then(function (handle) {
        console.log('Client Controls subscription ready');
        
        self.subscription = handle;
        
        // Get the control from the database and bind it to Angular's scope
        $scope.control = $scope.$meteorObject(Controls, { name: $scope.name } );

        if (angular.isUndefined($scope.control.getRawObject().stateMap) ) {
          throw new Error('Control statemap is not defined');
        }  
      
        if( angular.isUndefined($scope.control) ) {
          // Control was not found so throw up and error
          throw new Error('Control ' + $scope.name + ' was not found in database');
        }
        
        if( angular.isDefined($scope.control.getRawObject()) && $scope.control.getRawObject().name === $scope.name) {
          // Object received from DB so we can initialize the controller
          init();
        }
    });

    // Listen for MQTT messages
    MqttMessages.find({}).observe({

      added: function(m) {
        if( m.topic ===$scope.control.mqtt.in) {
          log('MQTT message received:', item);
          $scope.message = m;
          $scope.processMessage(m.message);
        }
      }
    });

    function processMessage(msg) {
      // message format is
      // SET <variable>=<value>
      // GET <variable>

      var m = msg.match(/^(SET|GET)/);
      if(!m) {
        log("Invalid MQTT message command. Ignoring. " + msg);
        return;
      }

      m = msg.match(/^(SET)[\s\t]*(enable|state)[\s\t]*=[\s\t]*(.+)$/);
      if(m) {
        var method   = m[1];
        var variable = m[2];
        var value    = m[3];

        if(variable === 'state') {
          if( !checkValidState(value) ) {
            log('Invalid value for state. Must be ' + Object.keys($scope.control.getRawObject().stateMap));
            return;
          }
         $scope.control.state = value;
        }

        if(variable === 'enable') {
          if( value !== 'false' && value !== 'true' ) {
            log('Invalid value for enable. Must be true or false');
            return;
          };
         $scope.control.enable = value;
        }
      }
      else {
        log("Invalid MQTT message. Ignoring. " + msg);
      }

      m = msg.match(/^(GET)[\s\t]*(enable|state)$/);
      if(m) {
        var method   = m[1];
        var variable = m[2];

        if(variable === 'state') {
          log('state = ' + $scope.control.state);
        }

        if(variable === 'enable') {
          log('enable = ' + $scope.control.enable);
        }
      }
      else {
        log("Invalid MQTT message. Ignoring. " + msg);
      }

    };

    function checkValidState(state) {
      var states = Object.keys($scope.control.getRawObject().stateMap);
      return states.indexOf(state) !== -1;
    }

    /**
     * Initialize the audio files.
     */
    function init() {
      if (angular.isUndefined($scope.control.getRawObject().stateMap) ) {
       // throw new Error('Control statemap is not defined');
      }
      
      var states = Object.keys($scope.control.getRawObject().stateMap);
      sounds= {};

      angular.forEach(states, function(state) {
        var audio = getStateObj(state).audio;
        if(audio) {
          if( audio.file ) {
            log('file ' + audio.file +' will be played for state "' + state.toString() + '"');
            var volume = 0.5 || audio.volume;
            sounds[state] = new Howl({
              src: [audio.file],
              volume: volume,
              onend: function() {
                log('Audio ' + audio.file);
              }
            });
          } else {
            log('Audio file not defined');
          }

        }
      })
    }

    /**
     * replace tags with object properties in a string
     */
    function replaceTags(str) {
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
    }

    function checkAndSetTimer() {
      // Check for timers
      var timer = getStateObj().timer;

      // If a timer is already on lets clear it first
      if( self.stateTimer ) {
        clearTimeout(self.stateTimer);
      }

      if( timer ) {
        if( timer.delay ) {
          if( typeof timer.next_state !== 'undefined') {

            log('Timed State Change from ' +
                $scope.control.state +
                ' to ' +
                timer.next_state +
                ' in ' +
                timer.delay +
                'ms');

            self.stateTimer = setTimeout(function () {
              log('Timer fired, setting state to: ' + timer.next_state);
              $scope.click(timer.next_state);
            }, timer.delay);

          }
          else {
            log('timer next_state not defined');
          }
        }
        else {
          log('timer delay not defined');
        }
      }
    };

    function actionAudio() {
      var audio = sounds[$scope.control.state];

      if( audio ) {
        audio.play();
      }
    };

    function actionTTS() {
      if (typeof SpeechSynthesisUtterance === 'undefined' ) {
        log('TTS not supported by this browser');
        return;
      }
      
      var tts = getStateObj().tts;

      if( angular.isUndefined(tts) ) {
        return;
      }

      var msg = replaceTags(tts.msg);

      var text = new SpeechSynthesisUtterance(msg);
      window.speechSynthesis.speak(text);
    };

    function actionHttp() {
        log('http action');
    };

    function actionMqtt() {
        log('MQTT action');
    };

    function log(msg) {
      console.log($scope.name + ':' + msg);
    };

    function getStateObj(state){
      state = state || $scope.control.state;

      if( angular.isUndefined($scope.control.getRawObject().stateMap[state])) {
        throw new Error($scope.name + ' bad control state:' + state);
      }

      return $scope.control.getRawObject().stateMap[state];
    };    
    
    $scope.press = function() {
      if (!self.subscription.ready) {
        log('press: controls collection subscription not ready');
        return;
      }
      log('Press/Hold. Current state is ' + $scope.control.state);
    };

    $scope.doubletap = function () {
      if (!self.subscription.ready) {
        log('doubletap: controls collection subscription not ready');
        return;
      }
      log('Doubletap. Current state is ' + $scope.control.state);
      self.doubleTapGuard = true;
    };

    $scope.tap = function () {
      if (!self.subscription.ready) {
        log('tap: controls collection subscription not ready');
        return;
      } 
      setTimeout(function() {
        if(!self.doubleTapGuard) {
          $scope.click();
        }
        setTimeout(function() {
          self.doubleTapGuard = false;
        }, Meteor.settings.controls.doubletap_delay);
      }, Meteor.settings.controls.tap_delay);
    };
    
    $scope.click = function(state) {
      if (!self.subscription.ready) {
        log('click: controls collection subscription not ready');
        return;
      }
      
      log('Click/Tap. Current state is ' + $scope.control.state);
      
      state = state ||$scope.control.state;
      var stateMap = getStateObj(state);
      if ( angular.isUndefined(stateMap.next_state) ) {
        throw new Error('next_state does not exist in state_map for state ' + state);
      }
      
      var nextState = stateMap.next_state;

      // Check is Next State is set
      if( angular.isUndefined(nextState) ) {
        throw new Error('next_state undefined for state ' + $scope.control.state);
      }

      // Check if next state exists in the state map
      if( angular.isUndefined($scope.control.getRawObject().stateMap[nextState]) ) {
        throw new Error('next_state does not exist in state_map for state ' + $scope.control.state);
      }

      // We're good lets move to next_state
      $scope.control.state = nextState;
      log('Click/Tap. State changed to ' + nextState);
      
      // Update the $scope
      $scope.$apply();
      
      // Local actions
      checkAndSetTimer();
      actionAudio();
      actionTTS();
    };
    
    $scope.getImage = function() {
      if (!self.subscription.ready ) {
        log('getImage: controls collection subscription not ready');
        return '';
      }
      return $scope.control.getRawObject().stateMap[$scope.control.state].image;
    };

  }]);