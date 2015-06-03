// Ensure types is created regardless of Meteor load order

serverConfig = serverConfig || { };
serverConfig.controls = serverConfig.controls || { };
serverConfig.controls.types = serverConfig.controls.types || { };


// Actual Configuration!
serverConfig.controls.types["switch"] = {
    
    basic_commands: [
        "ON", "OFF"
    ],
    
    // By default properties are read only so you only need to specify the writable ones
    properties: {
        enable: {
            acl: "rw",
            type: "boolean"
        },
        state: {
            acl: "rw",
            type: "string",
        },
        locale: {
            acl: "rw",
            type: "string"
        },
        
    }
};

