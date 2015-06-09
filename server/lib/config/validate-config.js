/**
 * Created by pedro on 6/7/15.
 */

/*jslint node: true */
"use strict";

check(serverConfig, Object);
check(serverConfig.mqtt, Match.ObjectIncluding({
  collection: String,
  security: {
    max_message_length: Match.Integer,
    max_topic_length: Match.Integer,
    valid_routes: [ RegExp ],
    max_name_length: Match.Integer,
    max_route_length: Match.Integer
  }
}));

var brokers = Object.keys(serverConfig.mqtt.brokers);
brokers.forEach(function(broker){
  check(serverConfig.mqtt.brokers[broker], {
    url: String,
    client_id: String,
    user: String,
    pass: String,
    topic: String,
    topic_qos: Match.Where(function(n) {
      check(n, Match.Integer);
      return n === 0 || n === 1 || n === 2;
    }),
    patterns: [ String ]
  });
});

check(serverConfig.controls, Match.ObjectIncluding({
  collection: String,
  security: {
    max_name_length: Match.Integer
  }
}));
