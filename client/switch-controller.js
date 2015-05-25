/**
 * Created by pedro on 5/20/15.
 */

//angular.module(NG_APP_NAME,['angular-meteor', 'ngMaterial', 'ngMdIcons']);

angular.module(NG_APP_NAME).controller("SwitchController", ['$scope', '$meteor',
  function($scope, $meteor){

    var doubleTapGuard = false;

    //$scope.switch = $meteor.collection(Controls).find( { name: $scope.name } );

    MqttMessages.find({}).observe({

      added: function(m) {
        if( m.topic === $scope.switch.mqtt.in) {
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
            $scope.log('Invalid value for state. Must be ' + Object.keys($scope.switch.stateMap));
            return;
          }
          $scope.switch.state = value;
        }

        if(variable === 'enable') {
          if( value !== 'false' && value !== 'true' ) {
            $scope.log('Invalid value for enable. Must be true or false');
            return;
          };
          $scope.switch.enable = value;
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
          $scope.log('state = ' + $scope.switch.state);
        }

        if(variable === 'enable') {
          $scope.log('enable = ' +$scope.switch.enable);
        }
      }
      else {
        $scope.log("Invalid MQTT message. Ignoring. " + msg);
      }

    };

    $scope.checkValidState = function (state) {
      var states = Object.keys($scope.switch.stateMap);
      return states.indexOf(state) !== -1;
    };

    $scope.init = function() {
      var states = Object.keys($scope.switch.stateMap);
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
      if( angular.isDefined($scope.switch.name) ) {
        str = str.replace(/<NAME>/g,$scope.switch.name);
      }

      if( angular.isDefined($scope.switch.label) ) {
        str = str.replace(/<LABEL>/g, $scope.switch.label);
      }

      if( angular.isDefined($scope.switch.path) ) {
        str = str.replace(/<PATH>/g, $scope.switch.path);
      }

      if( angular.isDefined($scope.switch.state) ) {
        str = str.replace(/<STATE>/g, $scope.getStateObj().label);
      }
      return str;
    };

    $scope.click = function(state) {
      state = state || $scope.switch.state;
      var nextState = $scope.getStateObj(state).next_state;

      // Check is Next State is set
      if( angular.isUndefined(nextState) ) {
        throw new Error('next_state undefined for state ' + $scope.switch.state);
      }

      // Check if next state exists in the state map
      if( angular.isUndefined($scope.switch.stateMap[nextState]) ) {
        throw new Error('next_state does not exist in state_map for state ' + $scope.switch.state);
      }

      // We're good lets move to next_state
      $scope.switch.state = nextState;
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
              $scope.log('Timer fired, setting state:' + $scope.switch.state);
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
      var audio = $scope.sounds[$scope.switch.state];

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
      console.log($scope.switch.name + ':' + msg);
    };

    $scope.getStateObj = function(state){
      state = state || $scope.switch.state;

      if( angular.isUndefined($scope.switch.stateMap[state])) {
        throw new Error($scope.name + ' bad switch state:' + state);
      }

      return $scope.switch.stateMap[state];
    };

    $scope.getLabel = function() {
      return $scope.switch.label;
    };

    $scope.getName = function() {
      return $scope.switch.name;
    };

    $scope.buttonAction = function() {
      alert('Button clicked');
    };

    $scope.getImage = function() {
      return $scope.switch.stateMap[$scope.switch.state].image;
    };

    // Initialize Controller
    $scope.init();

  }]);
