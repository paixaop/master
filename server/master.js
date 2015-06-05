/**
 * Created by pedro on 6/4/15.
 */
Master = function() {
  var self = this;

  self.register = function() {
    self.MQTT = new MQTT();
    self.Control = new Control();
    self.Utils = new Utils();
  };

};

