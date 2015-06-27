// List of all connections to MQTT brokers, indexed by broker's name from the settings file
var mqttBrokers = { };
var mqttPatterns = { };

/**
 * Connect to all configured MQTT brokers
 */
function connectMqttAllBrokers() {
  var keys = Object.keys(Meteor.settings.mqtt);
  angular.forEach(keys, function(key) {
    connectMqttBroker(key);
  });
}

/**
 * Connect to the MQTT Broker and set up subscriptions
 */
function connectMqttBroker(brokerName) {
    
  var broker = '';
  
  if( brokerName ) {
    broker = Meteor.settings.mqtt[brokerName];
  }
  else {
    brokerName = 'default';
    broker = {
        "url": "mqtt://localhost:1883",
        "client_id": "masterControl",
        "control_topic": "masterControl/mybroker",
        "collection": "mybroker_mqtt"
    };
  } 
  
  if (angular.isUndefined(broker)) {
    throw new Error('Unknown MQTT broker ' + brokerName);
  }
  
  console.log('Attempt MQTT connection to broker ' + broker.url);
  
  var options = { };
  
  if (broker.client_id) {
    option.clientId = broker.client_id;
  }
  
  if (broker.user) {
    options.user = broker.user;
  }
  
  if (broker.pass) {
    options.pass = broker.pass;
  }

  mqttBroker[brokerName] = mqtt.connect(broker.url, {
    clientId: broker.client_id
  });
  
  broker.control_topic = broker.control_topic || 'master/#';
  
  mqttBroker[brokerName].on("connect", function() {

    console.log("MQTT: " + brokerName + " Connected");

    // Subscribe to the main control topic
    subscribeTopic(broker.control_topic,function(error) {
      if (error) {
        throw new Error('MQTT: ' + brokerName + ' cannot subscribe to topic ' + broker.control_topic);        
      }
      console.log("MQTT: " + brokerName + " subscribed to topic " + broker.control_topic);    
    });
    
    // Set message patterns
    var patterns = broker.patterns || [ "master/+thing/+name/#path" ];
    
    // Create regular expression for extracting parameters from topics
    angular.forEach(patterns, function(pattern) {
      mqttPatterns[brokerName] = [ ];
      mqttPatterns[brokerName].push(mqtt_regex(pattern).exec);
    });
    
    // Add MQTT messages to our mongoDB 'messages' collection as they arrive
    Meteor.publish(broker.collection, function() {

      var self = this;

      // Publish MQTT message to the database
      mqttBroker[brokerName].on("message", function(topic, message) {
        console.log("MQTT: " + brokerName + " Topic:", topic, "Receive Message:", message.toString());
        
        var ts = new Date();
        var msg = {
          message: message.toString(),
          topic: topic,
          ts: ts.getTime(),
          broker: brokerName
        };
        
        var params = { };
        for(i=0; i < mqttPatterns[brokerName].length; i++) {  
          params = mqttPatterns[brokerName][i](topic);
          if( params ) {
            msg.params = params;
            break;  
          }
        }
        
        self.added(broker.collection, ts.toString(), msg);
        
        // Process Message
        processMessage(msg);
        
      });

      self.ready();
      //ready = true;
    });

    mqttBroker[brokerName].on("error", function(param) {
      console.log("MQTT: " + brokerName + " Error:" + param.toString());
      var ts = new Date();
      var msg = {
        message: brokerName + " Error:" + param.toString(),
        topic: broker.control_topic,
        ts: ts.getTime(),
        broker: brokerName
      };
      
      self.added(broker.collection, ts.toString(), msg);
    });
    
    mqttBroker[brokerName].on("offline", function() {
      console.log("MQTT: " + brokerName + " client offline");
      var ts = new Date();
      var msg = {
        message: brokerName + " client offline",
        topic: broker.control_topic,
        ts: ts.getTime(),
        broker: brokerName
      };
      
      self.added(broker.collection, ts.toString(), msg);
    });
    
    mqttBroker[brokerName].on("close", function() {
      console.log("MQTT: " + brokerName + " client disconnected");
      var ts = new Date();
      var msg = {
        message: brokerName + " client disconnected",
        topic: broker.control_topic,
        ts: ts.getTime(),
        broker: brokerName
      };
      
      self.added(broker.collection, ts.toString(), msg);
    });
    
    mqttBroker[brokerName].on("reconnect", function() {
      console.log("MQTT: " + brokerName + " client disconnected");
      var ts = new Date();
      var msg = {
        message: brokerName + " client disconnected",
        topic: broker.control_topic,
        ts: ts.getTime(),
        broker: brokerName
      };
      
      self.added(broker.collection, ts.toString(), msg);
    });
    
  });
}

/**
 * Subscribe to a MQTT topic
 */
function subscribeTopic(topic, next) {
  next = next || function(error) {
    return error
  };
  if (mqttClient) {
    mqttClient.subscribe(topic, function(error, granted) {
      if (error) {
        return next(error);
      }
      console.log("MQTT: Subscribed to " + granted.topic + " topic, with QoS " + granted.qos);
      return next(false);
    });
  } else {
    throw new Error('Not connected to any MQTT Broker and attempting subscriptions...')
  }
}

/**
 * Unsubscribe from MQTT Topic
 */
function unsubscribeTopic(topic, next) {
  next = next || function(error) {
    return error
  };
  if (mqttClient) {
    mqttClient.unsubscribe(topic, function() {
      console.log("MQTT: unsbscribed from " + topic + " channel");
      next();
    });
  } else {
    throw new Error('Not connected to any MQTT Broker and attempting unsbscriptions...')
  }
}

/**
 * process MQTT messages
 */
function processIncommingMqttMessage(msg) {
  var brokerName = msg.broker;
  var broker = Meteor.settings.mqtt[brokerName];
  
  if ( !msg.params.thing) {
    console.log('MQTT Error: thing was not found in MQTT topic. Example: master/<thing>/<name>/');
    return;
  }
  
  if ( !msg.params.thing.match(/^control|screen|panel$/g) ) {
    console.log('MQTT Error: thing must screen, panel or control');
    return;
  }
  
  if ( !msg.params.name) {
    console.log('MQTT Error: name was not found in MQTT topic. Example: master/<name>/');
    return;
  }
  
  if( msg.params.thing.match(/control/) ) {
    processControlMessage(control, msg);
  }
  
  if( msg.params.thing.match(/screen/) ) {
    // TODO: screen MQTT message process
  }
  
  if( msg.params.thing.match(/panel/) ) {
    // TODO: panel MQTT message process
  }
}

function processControlMessage(msg) {
  control = Controls.find( { name: msg.params.name });
  if (!control) {
    console.log('MQTT: control not found: ' + msg.params.name );
    return;
  }
  
  if (control.path !== msg.params.path) {
    console.log('MQTT: WARNING! Control ' + msg.params.name + ' found but there\'s a path mismatch. Expecting ' +
                control.path + ' got ' + msg.params.name + '. Ignoring path');
  }
  
  var possibleCommands = [ ];
  if (!control.type) {
    console.log('MQTT: WARNING: Control type unknown, possible control misconfiguration in database. Assuming it supports ON/OFF');
    possibleCommands = ["ON", "OFF"];
  }
  else {
    possibleCommands = Meteor.settings.controls.types[control.type];   
  }
 
}