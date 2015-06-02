// List of all connections to MQTT brokers, indexed by broker's name from the settings file
var Fiber = Npm.require("fibers");

var MQTT = function() {
  var self = this;
  
  self.mqttBrokers = { };
  self.mqttPatterns = { };
  
  self.collectionName = Meteor.settings.mqtt.collection || 'mqtt_messages';  
  self.collection = new Meteor.Collection(self.collectionName);
  
  /**
   * Connect to all configured MQTT brokers
   */
  self.connectMqttAllBrokers = function() {
    _.forEach(Meteor.settings.mqtt.brokers, function(value, key, list) {
      self.log('Attempt connection to broker:' + key);
      self.connectMqttBroker(key);
    });
  };

  /**
   * Disconnect from all MQTT Brokers
   */
  self.disconnectMqttAllBrokers = function() {
    _.forEach(Meteor.settings.mqtt.brokers, function(value, key, list) {
      self.disconnect(key);
    });
  };
  
  /**
   * Connect to a MQTT Broker and set up subscriptions
   */
  self.connectMqttBroker = function(brokerName) {
      
    var broker = '';
    
    if( brokerName ) {
      broker = Meteor.settings.mqtt.brokers[brokerName];
    }
    else {
      brokerName = 'default';
      broker = {
          "url": "mqtt://localhost:1883",
          "client_id": "masterControl",
          "topic": "master/#",
          "topic_qos": 0,
          "user": "user",
          "pass": "pass",
          "patterns" : [
              "master/+thing/+name/+ctrl/#path"
          ]
      };
    } 
    
    if (_.isUndefined(broker)) {
      throw new Error('Unknown MQTT broker ' + brokerName);
    }
    
    self.log('Connection URL ' + broker.url);
    
    var options = { };
    
    if (broker.client_id) {
      options.clientId = broker.client_id;
    }
    
    if (broker.user) {
      options.user = broker.user;
    }
    
    if (broker.pass) {
      options.pass = broker.pass;
    }
  
    // TODO Add user name and password, and certificates to MQTT Connect
    self.mqttBrokers[brokerName] = mqtt.connect(broker.url, {
      clientId: broker.client_id
    });
    
    broker.topic = broker.topic || 'master/#';
    
    self.mqttBrokers[brokerName].on("connect", function() {
  
      self.log(brokerName + " - Connected");
      
      self.log(brokerName + " - Subscribe to control topic: " + broker.topic);
  
      // Subscribe to the main control topic
      self.subscribeTopic(brokerName, broker.topic, function(error) {
        if (error) {
          throw new Error('MQTT: ' + brokerName + ' - cannot subscribe to topic ' + broker.topic);        
        }
      });
      
      // Set topic patterns
      var patterns = broker.patterns || [ "master/+thing/+name/#path" ];
      
      // Create regular expression for extracting parameters from topics
      _.forEach(patterns, function(pattern) {
        self.log('Set topic regex to ' + pattern);
        self.mqttPatterns[brokerName] = [ ];
        self.mqttPatterns[brokerName].push(mqttregex(pattern).exec);
      });
      
      //x Add MQTT messages to our mongoDB 'messages' collection as they arrive
      
      self.log('Set message event handlers');
      self.setEventHandlers(brokerName);
      
    });
  };
  
  self.setEventHandlers = function(brokerName) {
    
    // Message Event is triggered on every MQTT message
    self.mqttBrokers[brokerName].on("message", function(topic, message) {
      var msgThis = this;
      
      self.log(brokerName + " Topic: " + topic + " Received Message: " + message.toString());
      var msg = self.createMessageDocument(brokerName, topic, message);
      
      var params = { };
      for(var i=0; i < self.mqttPatterns[brokerName].length; i++) {
        var matchPattern = self.mqttPatterns[brokerName][i];
        params = matchPattern(topic);
        if( params ) {
          msg.params = params;
          break;  
        }
      }
      
      // TODO: Is valid Message
      
      Fiber(function() {
        self.collection.insert(msg, function(error) {
          if(error) {
            throw new Error('MQTT: Could not insert MQTT Message into ' + self.collectionName);
          }
        });
      }).run();
      
      // Process Message
      //processMessage(msg);
    });

    self.mqttBrokers[brokerName].on("error", function(param) {
      self.log("MQTT: " + brokerName + " Error:" + param.toString());
    });
    
    self.mqttBrokers[brokerName].on("offline", function() {        
      self.log(brokerName + " offline");
    });
    
    self.mqttBrokers[brokerName].on("close", function() {
      self.log(brokerName + " disconnected");
    });
    
    self.mqttBrokers[brokerName].on("reconnect", function() {
      self.log(brokerName + " reconnected");
    });
  };
  
  /**
   * Check messages for security problems
   * @return false is there are problems
   */
  self.isSecure = function(brokerName, msg) {
    if (msg.topic.length > Meteor.settings.mqtt.security.max_topic_size) {
      self.log('WARNING: Possible hack attempt topic length greater than maximum allowed value. Ignoring message.');
      return false;
    }
    
    if (msg.message.length > Meteor.settings.mqtt.security.max_message_size) {
      self.log('WARNING: Possible hack attempt message length greater than maximum allowed value. Ignoring message.');
      return false;
    }
    return true;
  };
  
  /**
   * Create a new document with MQTT message that can be insterted into Mongo
   * @returns document object
   * @returns undefined if message has any security problems
   */
  self.createMessageDocument = function(brokerName, topic, message) {
    
    var ts = new Date();
    var msg = {
      message: message.toString(),
      topic: topic,
      ts: ts.getTime(),
      broker: brokerName
    };
    
    if ( !self.isSecure(brokerName, message) ) {
      return undefined;
    }
    
    return msg;
  };
  
  /**
   * Subscribe to a MQTT topic
   */
  self.subscribeTopic = function(brokerName, topic, next) {
    
    next = next || function(error) {
      return error
    };
    
    if (self.mqttBrokers[brokerName]) {
      
      var options = { };
      options.qos = Meteor.settings.mqtt.brokers[brokerName].topic_qos || 0;
      
      self.mqttBrokers[brokerName].subscribe(topic, options, function(error, granted) {
        if (error) {
          return next(error);
        }
        //debugger;
        self.log("Subscribed to " + granted[0].topic + " topic, with QoS " + granted[0].qos);
        return next(false);
      });
      
    } else {
      throw new Error('Not connected to any MQTT Broker and attempting subscriptions...')
    }
  };
  
  /**
   * Unsubscribe from MQTT Topic
   */
  self.unsubscribeTopic = function(brokerName, topic, next) {
    next = next || function(error) {
      return error
    };
    if( self.mqttBrokers[brokerName] ) {
      self.mqttBrokers[brokerName].unsubscribe(topic, function() {
        self.log("Unsbscribed from " + topic + " channel");
        next();
      });
    } else {
      throw new Error('Not connected to any MQTT Broker and attempting unsbscriptions...')
    }
  };
  
  /**
   * process MQTT messages
   */
  self.processIncommingMqttMessage = function(msg) {
    var brokerName = msg.broker;
    var broker = Meteor.settings.mqtt.brokers[brokerName];
    
    if ( !msg.params.thing) {
      self.log('Error: thing was not found in MQTT topic. Example: master/<thing>/<name>/');
      return;
    }
    
    if ( !msg.params.thing.match(/^control|screen|panel$/g) ) {
      self.log('Error: thing must screen, panel or control');
      return;
    }
    
    if ( !msg.params.name) {
      self.log('Error: name was not found in MQTT topic. Example: master/<name>/');
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
  };
  
  self.processControlMessage = function(msg) {
    control = Controls.find( { name: msg.params.name });
    if (!control) {
      self.log('Control not found: ' + msg.params.name );
      return;
    }
    
    if (control.path !== msg.params.path) {
      self.log('WARNING! Control ' + msg.params.name + ' found but there\'s a path mismatch. Expecting ' +
                  control.path + ' got ' + msg.params.name + '. Ignoring path');
    }
    
    var possibleCommands = [ ];
    if (!control.type) {
      self.log('WARNING: Control type unknown, possible control misconfiguration in database. Assuming it supports ON/OFF');
      possibleCommands = ["ON", "OFF"];
    }
    else {
      possibleCommands = Meteor.settings.controls.types[control.type];   
    }
   
  };
  
  self.observeChanges = function(brokerName) {
    
    // Observe the Controls collection
    // Any changes to Control documents will generate a MQTT message that reflects
    // that change to the rest of the network
    Controls.observeChanges({
      added: function(id, doc) {
        if( doc && doc.topic && doc.message && doc.broker ) {
          var msg = typeof doc.message === 'object' ? JSON.stringify(doc.message) : doc.message + "";
          
          self.mqttBrokers[doc.broker].publish(doc.topic, msg);
        }
      }
	});
  }
  
  /**
   * Disconnect from MQTT Broker
   */
  self.disconnect = function(brokerName) {
	if( self.mqttBrokers[brokerName] ) {
      self.mqttBrokers[brokerName].end();
	  self.mqttBrokers[brokerName] = null;
    }
  };
  
  /**
   * Simple Log function
   */
  self.log = function(msg) {
    console.log('MQTT: ' + msg.toString());
  };
};

Meteor.MQTT = new MQTT();

