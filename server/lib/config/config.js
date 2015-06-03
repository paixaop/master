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
        max_topic_length: 1000
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
            
            // Paterns to match toic structure and extract named parameters
            patterns: [
               "master/+thing/+name/+ctrl/#path"
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
        max_control_name_length: 200
    }
};

// User serverConfigurations
serverConfig.users = {
    auth: false
};




