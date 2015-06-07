/**
 * Created by pedro on 6/6/15.
 */
var Control = function(scope, name) {
  var self = this;

  self.subscription = {
    ready: false
  };

  self.scope = scope;
  self.name = name;
  self.timer = 0;

  self.log = function(msg) {
    if( clientConfig.debug ) {
      console.log(self.name + ':' + msg);
    }
  };

  self.scope.$meteorSubscribe(clientConfig.controls.collection,
    { name: self.name }).then(function (handle) {

      self.log(self.name + ': Client Controls subscription ready.');

      self.subscription = handle;

      // Get the control from the database and bind it to Angular's scope
      self.scope.control = self.scope.$meteorObject(Controls, { name: self.name } );

      if (angular.isUndefined(self.scope.control.getRawObject().stateMap) ) {
        throw new Error('Control statemap is not defined');
      }

      if( angular.isUndefined(self.scope.control) ) {
        // Control was not found so throw up and error
        throw new Error('Control ' + self.name + ' was not found in database');
      }
    });

  /**
   * Monitor database changes
   */
  Controls.find( { name: self.name } ).observe({

    // Any changes?
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

  /**
   * replace tags with object properties in a string
   */
  self.replaceTags = function(str) {
    if( angular.isDefined(self.scope.control.name) ) {
      str = str.replace(/<NAME>/g,self.scope.control.name);
    }

    if( angular.isDefined(self.scope.control.label) ) {
      str = str.replace(/<LABEL>/g,self.scope.control.label);
    }

    if( angular.isDefined(self.scope.control.path) ) {
      str = str.replace(/<PATH>/g,self.scope.control.path);
    }

    if( angular.isDefined(self.scope.control.state) ) {
      str = str.replace(/<STATE>/g, self.scope.control.state);
    }
    return str;
  };


  self.setTimer = function(delay, callback) {

    // If a timer is already on lets clear it first
    if( self.timer ) {
      clearTimeout(self.timer);
    }

    log('Set timer. Will fire in ' + delay + ' ms');
    Meteor.setTimeout(function() {
      log('Timer fired ms');
      return callback;
    }, delay);

  };

  self.actionAudio = function() {
    var audio = sounds[$scope.control.state];

    if( audio ) {
      audio.play();
    }
  };

  /**
   * Speak a message using Text to Speech
   * @param str {String} message to speak
   */
  self.actionTTS = function(action) {
    if (typeof SpeechSynthesisUtterance === 'undefined' ) {
      log('TTS not supported by this browser');
      return;
    }

    if( angular.isUndefined(action.message) ) {
      return;
    }

    var msg = replaceTags(action.message);

    var text = new SpeechSynthesisUtterance(msg);
    window.speechSynthesis.speak(text);
  };


  self.actionHttp = function(action) {
    log('http action');
  };

  self.actionMqtt = function(action) {
    if( !action.topic ||
        !action.message ) {

      self.log('WARNING: action MQTT, missing topic or message. Ignoring');

    }

    var topic = self.replaceTags(action.topic);
    var message = self.replaceTags(action.message);

    self.log('Requesting server to send MQTT message : ' +
      message + ' on topic ' + topic);

    Meteor.call("publish", action.broker, {
      topic: topic,
      message: message
    });
  };

  self.actions = function(actions) {

    if (!self.subscription.ready) {
      log('click: controls collection subscription not ready');
      return;
    }

    if( !_.isArray(actions) ) {
      self.log('actions must be an array. Ignoring');
      return;
    }

    /*
    self.setTimer();
    self.actionAudio();
    self.actionTTS();
    */

    angular.forEach(actions, function(action) {
      self.log('Action: ' + action.type);
      switch( action.type ) {
        case 'timer':
          break;
        case 'mqtt' :
          self.actionMqtt(action);
          break;
        case 'http':
          break;
        case 'audio':
          break;
        case 'tts':
          self.actionTTS(action);
          break;
        default:
          log('Unknown action type ' + action.type);
      };
    });

  }

}