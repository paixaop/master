/**
 * Created by pedro on 5/18/15.
 */

var master = function () {

}

Controls = new Meteor.Collection(serverConfig.controls.collection);

// Publish the Controls collection to the clients
Meteor.publish(serverConfig.controls.collection, function(selector, options, publisher) {
  console.log('Controls subscription requested by client');
  return Controls.find(selector, options);
});


// Only used when data comes from the code. Server methods do not
// go through allow/deny functions
// TODO: Check Content-security-policy server header
Controls.allow({
  insert: function() {
    return true;
  },
  update: function() {
    return true;
  },
  remove: function() {
    return true;
  }
});

// Runs right after startup
Meteor.startup(function() {

  console.log('Starting server');

  Meteor.MQTT.connectMqttAllBrokers();

  if (Controls.find().count() === 0) {

    var controls = [{
        'type': 'switch',

        'name': 'chandelier_switch',
        'path': '/thing/lights/kitchen',

        'locale': 'en-US',

        'enable': true,

        'label': 'Chandelier',
        'show_label': true,

        'state': false,

        'template': 'templateDir',

        'stateMap': {
          true: {
            'label': 'on',
            'image': 'switch-on.png',
            'css': '',

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

            'actions': [{
                'broker': 'mybroker',
                'type': 'mqtt',
                'topic': '<PATH>/<NAME>',
                'message': 'ON',
                'delay': 50
              }, {
                'type': 'http',
                'url': 'http://server:port/<PATH>/<STATE>',
                'method': 'GET'
              }, {
                'type': 'audio',
                'url': 'flip.mp3',
                'volume': 0.5
              }, {
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
            'css': '',
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

            'actions': [{
                'type': 'mqtt',
                'broker': 'mybroker',
                'topic': '<PATH>/<NAME>',
                'message': 'OFF'
              }, {
                'type': 'http',
                'url': 'http://server:port/<PATH>/<STATE>',
                'method': 'GET'
              }, {
                'type': 'audio',
                'url': 'flip.mp3',
                'volume': 0.9
              }, {
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
