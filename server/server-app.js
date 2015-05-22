/**
 * Created by pedro on 5/18/15.
 */

var mqttClient;

// Runs right after startup
Meteor.startup(function () {

  connectAndSetMqttBroker();

  if (Controls.find().count() === 0) {

    var controls = [
      {
        'type' : 'switch',

        'name': 'chandelier_switch',
        'path': 'lights/kitchen',

        'locale': 'en-US',

        'enable': true,

        'label': 'Chandelier',
        'show_label': true,

        'state': false,

        'template': 'templateDir',

        'mqtt': {
          'in': 'lights/kitchen/<NAME>',
          'out': 'lights/ktichen/<NAME>',
          'enable': true
        },

        'stateMap': {
          true: {
            'label': 'on',
            'image': 'switch-on.png',

            'next_state': false,

            'timer': {
              'delay': 5000,
              'next_state': false
            },

            'audio': {
              'file': '/audio/clip.wav',
              'volume': 0.5
            },

            'tts': {
              'voice': 'alex',
              'volume': 85,
              'msg': '<LABEL> turned on!'
            },

            'actions': [
              {
                'type': 'mqtt',
                'topic': '<PATH>',
                'msg': '<PATH>/<NAME>/<STATE>',
                'delay': 50
              },
              {
                'type': 'http',
                'url': 'http://server:port/<PATH>/<STATE>',
                'method': 'GET'
              },
              {
                'type': 'audio',
                'url': 'flip.mp3',
                'volume': 0.5
              },
              {
                'type': 'tts',
                'voice': 'alex',
                'volume': 85,
                'msg': '<LABEL> turned on!'
              }
            ]
          },
          false: {
            'label': 'off',
            'image': 'switch-off.png',

            'next_state': true,

            'audio': {
              'file': '/audio/clap.wav',
              'volume': 0.5
            },

            'tts': {
              'voice': 'alex',
              'volume': 85,
              'msg': '<LABEL> turned off!'
            },

            'actions': [
              {
                'type': 'mqtt',
                'topic': '<PATH>',
                'msg': '<PATH>/<NAME>/<STATE>'
              },
              {
                'type': 'http',
                'url': 'http://server:port/<PATH>/<STATE>',
                'method': 'GET'
              },
              {
                'type': 'audio',
                'url': 'flip.mp3',
                'volume': 0.9
              },
              {
                'type': 'tts',
                'voice': 'alex',
                'volume': 85,
                'msg': '<LABEL> turned off'
              }
            ]
          }
        }
      }
    ];

    for (var i = 0; i < controls.length; i++)
      Controls.insert(controls[i]);
  }
});

Meteor.methods({
  subscribe: function(topic) {
    subscribeTopic(topic);
  },

  unsubscribe: function(topic) {
    unsubscribeTopic(topic)
  }
});

function connectAndSetMqttBroker() {

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

      mqttClient.on("message", function(topic, message) {
        console.log("MQTT: Channel:", topic, "Receive Message:", message.toString());
        var msg = {
          message: message.toString(),
          topic: topic,
          ts: new Date()
        };
        self.added(MQTT_MESSAGES_COLLECTION_NAME, new Date().toString(), msg);
      });

      self.ready();
      ready = true;
    });

    mqttClient.on("error", function(param) {
      console.log("MQTT: Error:",param.toString());
    });
  });
}

function subscribeTopic(topic) {
  if(mqttClient) {
    mqttClient.subscribe(topic, function(error, granted) {
      if(error) {
        throw error;
      }
      console.log("MQTT: Subscribed to " + granted.topic + " topic, with QoS " + granted.qos);
    });
  }
}

function unsubscribeTopic(topic) {
  if(mqttClient) {
    mqttClient.unsubscribe(topic, function() {
      console.log("MQTT: Subscribed to " + topic + " channel");
    });
  }
}