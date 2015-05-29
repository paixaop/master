/**
 * Connect to the MQTT Broker and set up subscriptions
 */
function connectMqttBroker() {
  
  console.log('Attempt MQTT connection to broker ' + MQTT_BROKER_URL);

  mqttClient = mqtt.connect(MQTT_BROKER_URL, {
    clientId: MQTT_CLIENT_ID
  });

  mqttClient.on("connect", function() {

    console.log("MQTT: Connected");

    mqttClient.subscribe(MQTT_TOPIC);
    console.log("MQTT: Subscribed to " + MQTT_TOPIC + " channel");

    // Add MQTT messages to our mongoDB 'messages' collection as they arrive
    Meteor.publish('messages', function() {

      var self = this;

      // Publish MQTT message to the database
      mqttClient.on("message", function(topic, message) {
        console.log("MQTT: Channel:", topic, "Receive Message:", message.toString());
        
        var ts = new Date();
        var msg = {
          message: message.toString(),
          topic: topic,
          ts: ts.getTime()
        };
        self.added(MQTT_MESSAGES_COLLECTION_NAME, ts.toString(), msg);
        
        // Process Message
        processMessage(msg);
        
      });

      self.ready();
      //ready = true;
    });

    mqttClient.on("error", function(param) {
      console.log("MQTT: Error:", param.toString());
    });
  });
}


/**
 * Iterate all controls in the database and subscribe to their
 * MQTT topics.
 */
function subscbribeToAllControlChannels() {
  var controls = Controls.find();

  angular.forEach(controls, function(control, key) {
    // If the control is enabled and the MQTT settings configured
    // subscribe to the desired topic.
    if( control.enable &&
        control.mqtt &&
        control.mqtt. in ) {

      subscribeTopic(control.mqtt.in );

    }
  })
}

/**
 * Iterate all controls in the database and unsubscribe to their
 * MQTT topics.
 */
function unsubscbribeToAllControlChannels() {
  var controls = Controls.find();

  angular.forEach(controls, function(control, key) {
    // If the control is enabled and the MQTT settings configured
    // subscribe to the desired topic.
    if( control.enable &&
        control.mqtt &&
        control.mqtt. in ) {

      unsubscribeTopic(control.mqtt.in );

    }
  })
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
    
}