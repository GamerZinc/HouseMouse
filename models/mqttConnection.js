var util = require('util');
var EventEmitter = require('events').EventEmitter;
var connect;
var deviceModule = require('aws-iot-device-sdk/device');
var cmdLineProcess = require('aws-iot-device-sdk/examples/lib/cmdline');

var MQTTConnection = function() {
    var self = this;
    
    module.exports = cmdLineProcess;

    connectToMQTT();

    function connectToMQTT() {
        cmdLineProcess('connect to the AWS IoT service and publish/subscribe to topics using MQTT',
        process.argv.slice(2), getMQTT);
    }

    function getMQTT(args) {
    //
    // The device module exports an MQTT instance, which will attempt
    // to connect to the AWS IoT endpoint configured in the arguments.
    // Once connected, it will emit events which our application can
    // handle.
    //
        var device = deviceModule({
                keyPath: args.privateKey,
                certPath: args.clientCert,
                caPath: args.caCert,
                clientId: args.clientId,
                region: args.region,
                baseReconnectTimeMs: args.baseReconnectTimeMs,
                keepalive: args.keepAlive,
                protocol: args.Protocol,
                port: args.Port,
                host: args.Host,
                debug: args.Debug
        });

        var timeout;
        var count = 0;
        var minimumDelay = 250;

        device.subscribe('HouseMouse');
        
        if ((Math.max(args.delay, minimumDelay)) !== args.delay) {
                console.log('substituting ' + minimumDelay + 'ms delay for ' + args.delay + 'ms...');
        }

        device
                .on('connect', function() {
                self.emit('connect');
                });
        device
                .on('close', function() {
                self.emit('close');
                });
        device
                .on('reconnect', function() {
                self.emit('reconnect');
                });
        device
                .on('offline', function() {
                self.emit('offline');
                });
        device
                .on('error', function(error) {
                self.emit('error', error);
                });
        device
        .on('message', function(topic, payload) {
            self.emit('message', topic, payload);
        });
    }
};

util.inherits(MQTTConnection, EventEmitter);
module.exports = MQTTConnection;