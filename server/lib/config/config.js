serverConfig = { };

/*
 * MQTT
 * Configuration of MQTT brokers, and other settings. You can have many MQTT Brokers configured
 * simultaneously.
 */
serverConfig.mqtt = {
    // MongoDB collection where MQTT messages are inserted as they are received
    collection: "mqtt_messages",
    
    // Security checks
    security: {
        
        // Limit the maximum size of a MQTT message. Bigger messages are ignored
        max_message_length: 1000,
        
        // Limit the maximum size of a MQTT topic. Messages sent on longer topics are ignored
        max_topic_length: 1000,
        
        // Some parts of the MQTT topic are used as parameters to identify control names or
        // system routes, the following settings configure the validation of said parameters
        // after they are extracted from the topic string.
        
        // Regular expressions that validate the route parameter extracted from MQTT topic
        // if any of the regular expressions matches then route is considered valid
        valid_routes: [
            /^(?:control|screen|panel)$/
        ],
        
        // Maximum lenght of the name topic parameter
        max_name_length: 200,
        
        // Maximum length of the route topic parameter
        max_route_length: 100
    },
    
    
    // MQTT brokers
    brokers: {
        
        // Brokers must have unique names
        mybroker: {
            
            // Connection URL mqtt://, mqtts://
            url: "mqtt://localhost:1883",
            
            // CLient ID used to identify MQTT client to the broker
            client_id: "masterControl",
            
            // Authentication username and password
            user: "user",
            pass: "pass",
            
            // Topic to subscribe to and recieve messages, '+' and '#' MQTT wildcards are supported
            topic: "master/#",
            
            // QoS 0, 1, 2
            topic_qos: 0,
            
            /* Patterns to match topic structure and extract named parameters.
               Pattern Requirements:
            
                 * You MUST define `+name` as one of the parameters, as it will be used to 
                   retrieve the control from the database
                   
                 * You MUST define `+route` as one of the parameters. Route is used
                   to identify the message handler, control, screen or panel.
                   
            */
            patterns: [
               "master/+route/+name/+cmd/#path"
            ]
        }    
    }
};
    
// Contol serverConfiguration
serverConfig.controls = {
    
    // MongoDB collection used to store controls
    collection: "controls",
    
    security: {
        
        // Limit the maximum size of a MQTT message. Bigger messages are ignored
        max_name_length: 200
    }
};

// User serverConfigurations
serverConfig.users = {
    auth: false
};




