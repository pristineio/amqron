/* eslint-disable no-console */
'use strict';
var amqp = require('amqplib/callback_api');

var BROKER_URL = 'amqp://admin:admin@localhost/';
var TOCK_EXCHANGE = 'tock';

amqp.connect(BROKER_URL, function(err, connection) {
  connection.createChannel(function(err, channel) {
    channel.assertQueue(null, {exclusive: true}, function(err, q) {
      channel.bindQueue(q.queue, TOCK_EXCHANGE, '*.*.*.*.*.0');
      channel.consume(q.queue, function(message) {
        console.log('  Doing a thing @ ' + message.fields.routingKey);
      }, {noAck: true});
    });
  });
});
