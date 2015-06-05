/**
 * Created by pedro on 6/4/15.
 */
var MasterServer = function() {
  var self = this;

  self.register = function() {
    console.log('Master: Registering master modules');
    console.log('Master: Register MQTT');
    self.MQTT = new MQTT();

    console.log('Master: Register Control');
    self.Control = new Control();

    console.log('Master: Register Utils');
    self.Utils = new Utils();
  };

};

// Global Variables need to start Uppercase! master would not work...
Master = new MasterServer();
