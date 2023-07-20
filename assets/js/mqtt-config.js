//======================================================================
// MQTT Configuration
//======================================================================
var mqtt;
let reconnectTimeout = 2000;
let host = "test.mosquitto.org";
let port = 8080;

// create random mqtt topic
let randomNumber = Math.random() * 10000000;
let returnTopic = String(Math.floor(randomNumber));

// gateway id called from gateway-config.js
let topic = gatewayId + '/' + returnTopic;
console.log("MQTT Topic : " + topic);