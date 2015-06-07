
var module = angular.module('masterSwitch', ['angular-meteor']);

if( typeof Controls === 'undefined') {
  Controls = new Meteor.Collection(clientConfig.controls.collection);
}

/**
 * Custom element (tag) directive for control elements
 */
module.directive('masterSwitch', function() {
    return {
      scope: {
        name: '@'
      },

      // MUST GIVE FULL DIRECTORY PATH FOR THIS TO WORK!!
      templateUrl: 'client/controls/switch/master-switch-template.ng.html',
      controller: 'masterSwitchController'
    };
});

/**
 * Switch Controller. Controls the master-switch tag
 */
module.controller('masterSwitchController', ['$scope', '$meteor',
  function($scope, $meteor) {
    var self = this;

    self.stateChangeHandled = false;
    
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

    $scope.$meteorSubscribe(clientConfig.controls.collection,
                            { name: $scope.name }).then(function (handle) {
        console.log($scope.name + ': Client Controls subscription ready.');
        
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

    Controls.find( { name: $scope.name } ).observe({
      changed: function(newDoc, oldDoc) {
        if( self.subscription.ready) {
          if( oldDoc.state !== newDoc.state ) {
            if(!self.stateChangeHandled) {
              self.log('Controls: DB Changed ' + oldDoc.state + ' -> ' + newDoc.state);
              $scope.click(newDoc.state);
            }
            else {
              self.log('Controls: UI Changed ' + oldDoc.state + ' -> ' + newDoc.state);
            }
          }

          self.stateChangeHandled = false;
        }
      }
    });

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
      });
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
      var stateObj = getStateObj();
      var timer = stateObj.timer;

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
      if( clientConfig.debug ) {
        console.log($scope.name + ':' + msg);
      }
    };

    function getStateObj(state){
      if(typeof state === 'undefined') {
        state = $scope.control.state;
      }

      if( angular.isUndefined($scope.control.getRawObject().stateMap[state])) {
        throw new Error($scope.name + ' bad control state:' + state);
      }

      return $scope.control.getRawObject().stateMap[state];
    };

    function actions() {
      if (!self.subscription.ready) {
        log('click: controls collection subscription not ready');
        return;
      }

      var stateMap = getStateObj($scope.control.state);
      var actions = stateMap.actions;

      checkAndSetTimer();
      actionAudio();
      actionTTS();

      angular.forEach(actions, function(action) {
        log('Action: ' + action.type);
        switch( action.type ) {
          case 'mqtt' :
            log('Requesting server to send MQTT message : '+ replaceTags(action.message) + ' on topic ' + replaceTags(action.topic));

            Meteor.call("publish", action.broker, {
              topic: replaceTags(action.topic),
              message: replaceTags(action.message)
            });
            break;
          case 'http':
            break;
          case 'audio':
            break;
          case 'tts':
            break;
          default:
            log('Unknown action type ' + action.type);
        };
      });

    }
    
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
        }, clientConfig.controls.doubletap_delay);
      }, clientConfig.controls.tap_delay);
    };
    
    $scope.click = function(nextState) {
      if (!self.subscription.ready) {
        log('click: controls collection subscription not ready');
        return;
      }

      // Get current state's map
      var stateMap = getStateObj($scope.control.state);

      if ( angular.isUndefined(stateMap.next_state) ) {
        throw new Error('next_state does not exist in state_map for state ' + state);
      }
      
      log('Click/Tap. Current state is ' + $scope.control.state);

      if( typeof nextState === 'undefined') {
        nextState = stateMap.next_state;
      }
      
      //var nextState = stateMap.next_state;

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

      self.stateChangeHandled = true;
      
      // Update the $scope
      $scope.$apply();
      
      actions();
    };

    $scope.getImage = function() {
      if (!self.subscription.ready ) {
        log('getImage: controls collection subscription not ready');
        return '';
      }
      return $scope.control.getRawObject().stateMap[$scope.control.state].image;
    };

  }]);