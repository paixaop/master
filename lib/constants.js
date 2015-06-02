/**
 * Created by pedro on 5/20/15.
 */
/*
NG_APP_NAME = 'master';

// Adjust tap vs double tap detection
HAMMER_DOUBLE_TAP_DELAY = 500;
HAMMER_SINGLE_TAP_DELAY = 200;

MQTT_BROKER_URL = 'mqtt://localhost:1883';
MQTT_CLIENT_ID = 'remoteControl';
MQTT_TOPIC = 'remoteControl/' + NG_APP_NAME;

MQTT_MESSAGES_COLLECTION_NAME = "mqtt_messages";
CONTROLS_COLLECTION_NAME = "controls";

*/

isFunction = Match.Where(function (f) {
    return _.isFunction(f);
});