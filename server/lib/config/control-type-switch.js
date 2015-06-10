// Ensure types is created regardless of Meteor load order

serverConfig                = serverConfig || {};
serverConfig.controls       = serverConfig.controls || {};
serverConfig.controls.types = serverConfig.controls.types || {};


// Actual Configuration!
serverConfig.controls.types[ "switch" ] = {
  // Basic commands supported by this control type
  // Basic commands offer a simple way of issuing commands to the control
  // without an external system knowing about which internal property is
  // being manipulated For example it is self explanatory that a Swith has
  // the ON and OFF position
  basic: {
    commands: [
      "ON", "OFF"
    ],

    // Control property that will be updated on basic commands
    // By default any property that is set via a basic command is
    // considered writable
    set_property: "state",

    // Map basic commands to internal control states.
    command_map: {
      ON : true,
      OFF: false
    }
  },


  // By default properties are read only so you only need to specify the
  // writable ones
  properties: {
    enable: {
      acl : "rw",
      type: "boolean"
    },
    state : {
      acl : "rw",
      type: "string",
    },
    locale: {
      acl : "rw",
      type: "string"
    },

  }
};

