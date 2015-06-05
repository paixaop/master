/**
 * Control Utility functions
 *
 * Pedro Paixao
 */
var Fiber = Npm.require("fibers");
var Future = Npm.require('fibers/future');

Control = function () {
  var self = this;

  self.types = Object.keys(serverConfig.controls.types);

  if( !self.types ) {
    throw new Meteor.Error('Controls: no control types configured');
  }

  /**
   * Is the property writable
   */
  self.isWritable = function (controlSettings, property) {

    if( !property ||
        !controlSettings.properties ||
        !controlSettings.properties[ property ] ||
        !controlSettings.properties[ property ].acl ) {

      return false;
    }

    if( controlSettings.properties[ property ].acl.match(/w/gi) ) {
        return true;
    }

    return false;
  };

  /**
   * Check if a control is of expected type
   */
  self.isControlType = function (c, type) {

    if( !c.type ) {
      console.log('WARNING: Control type unknown, possible control misconfiguration in database.');
      return false;
    }

    var t = type === c.type;
    if( !t ) {
      console.log('Control ' + c.name + ' does not have the same type ' + type + ' is not ' + c.type);
    }
    return t;
  };

  self.validate = function (msg) {

    if(!msg.params[ "name" ]) {
      console.log('Controls: control name is mandatory');
      return undefined;
    }

    if( msg.params[ "name" ].length > serverConfig.controls.security.max_name_length ) {
      console.log('Control: WARNING: Possible security or configuration problem. Invalid name length. Ignoring message');
      return false;
    }

    return true;
  };

  /**
   * Get a control from the database
   * @param {String} controlName  The name of the control
   */

  self.getControlByName = function (controlName) {
    if( !controlName ) {
      console.log('Error. You must pass a control name ');
      return undefined;
    }

    check(controlName, String);
    if( controlName.length > serverConfig.controls.security.max_name_length ) {
      console.log('Controls: WARNING control name too big. Ignoring');
      return undefined;
    }

    if( controlName.length < 1 ) {
      console.log('Controls: WARNING control name too small. Ignoring');
      return undefined;
    }

    if( !controlName.match(/^[0-9a-z_-]+$/i) ) {
      console.log("Controls: bad characters in control name only 0-9, a-z, '_' and '_' allowed");
      return undefined;
    }

    var future = new Future();
    var c = null;

    console.log('Controls: searching control database for ' + controlName);
    Fiber(function() {
      c = Controls.findOne({name: controlName});
      future.return(c);
    }).run();

    future.wait(c);

    if( !c ) {
      console.log('Control not found: ' + controlName);
      return undefined;
    }
    else if( !c.type ) {
      console.log('WARNING: Control type unknown, possible control misconfiguration in database.');
      return undefined;
    }
    console.log('Controls: Found control with _id: ' + c._id);

    return(c);
  };

  /**
   * Process MQTT message
   * @param msg
   * @returns {undefined} if message is invalid
   * @returns {Object} parsed message and control if message is valid
   */
  self.processMessage = function (msg) {
    console.log('Controls: attempting to process message');
    if( !self.validate(msg) ) {
      return undefined;
    }

    console.log('Controls: control name is ' + msg.params[ "name" ]);

    // Message is OK so lets try and get the control from the database
    var control;

    //var get = Meteor._wrapAsync(self.getControlByName);
    //control = get(msg.params[ "name" ]);
    Fiber(function() {
      control = self.getControlByName(msg.params[ "name" ]);
      if( !control ) {
        console.log('Controls: No control found in database');
        return undefined;
      }

      msg.control = control;

      // Get control type
      var controlConfig = serverConfig.controls.types[control.type];
      var i = Master.Utils.matchOne(msg.message, controlConfig.basic.commands)

      if( i !== -1 ) {
        console.log('Controls: ' + msg.message + ' is a basic of the ' + control.type + ' control ' );
        msg.type  = 'basic';
        msg.valid = true;

        var up = {};
        up[control[controlConfig.basic.set_property]] = controlConfig.basic.command_map[msg.message];

        try {
          console.log('Controls: ' + msg.params[ "name" ] + ' set ' + controlConfig.basic.set_property + ' to ' + msg.message);
          Controls.update(
            { _id: control._id},
            up
          );
        }
        catch (error) {
          console.log(
            'Controls: could not update property ' + controlConfig.basic.set_property +
            ' of ' + control.name + ' for basic command: ' + msg.message
          );
          console.log('Controls: Error: ' + error.message());
        }
      }
      else {
        var m = msg.message.match(/([^=\s]+)\s*=\s*(.+)/);

        if( m ) {

          if( !self.isWritable(controlConfig, m[1]) ) {
            console.log('Controls: property ' + m[1] + ' not writable. Ignoring message.');
            return;
          }

          msg.type = 'propertyValue';
          msg.parse = {};
          msg.parse.property = m[1];
          msg.parse.value = m[2];
          msg.valid = true;
        }
        else {
          // if not a basic command then try JSON parsing
          try {
            var obj   = JSON.parse(msg.message);
            msg.type  = 'json';
            msg.parse = obj;
            msg.valid = true;
          }
          catch (error) {
            console.log('Control: Error invalid message in topic ' + msg.topic);
            return undefined;
          }
        }
      }

      return msg;
    }).run();

  };

};

/*
 var Switch = function() {
 var self = this;

 self.processMessage = function(msg) {
 var controlSettings = { };
 controlSettings = JSON.parse(Assets.getText("control.json"));

 var control = getControlByName(controlSettings, msg.params.name)

 if (!control) {
 return;
 }

 if( !isControlType(control.type, 'switch') ){
 return;
 }

 if (control.path !== msg.params.path) {
 console.log('WARNING! Control ' + msg.params.name + ' found but there\'s a path mismatch. Expecting ' +
 control.path + ' got ' + msg.params.name + '. Ignoring path');
 }


 }

 self.isValidMessage = function(msg) {
 // Validate message before processing it
 }

 }

 */