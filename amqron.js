/* eslint-disable no-console */
'use strict';
var amqp = require('amqplib/callback_api');

var BROKER_URL = 'amqp://admin:admin@localhost/';
var TICK_EXCHANGE = 'tick';
var TOCK_EXCHANGE = 'tock';

function dateToRoutingKey() {
  var now = new Date();
  return [now.getUTCFullYear(), now.getUTCMonth()+1, now.getUTCDate(),
    now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()].join('.');
}

function tick(channel) {
  console.log('[ TICK ]');
  channel.publish(TICK_EXCHANGE, dateToRoutingKey(), Buffer.from(''));
}

function configureExchanges(channel, cb) {
  channel.assertExchange(TICK_EXCHANGE, 'topic', {}, function(err) {
    if(err) {
      return cb(err);
    }
    channel.assertExchange(TOCK_EXCHANGE, 'topic', {
      internal: true
    }, function(err) {
      cb(err);
    })
  });
}

function configureTicker(channel, cb) {
  channel.assertQueue(null, {
    exclusive: true,
    messageTtl: 1000,
    deadLetterExchange: TOCK_EXCHANGE
  }, function(err, q) {
    if(err) {
      return cb(err);
    }
    channel.bindQueue(q.queue, TICK_EXCHANGE, '#', {}, function(err) {
      tick(channel);
      cb(err);
    });
  });
}

amqp.connect(BROKER_URL, function(err, connection) {
  connection.createChannel(function(err, channel) {
    if(err) {
      console.log(err);
    }
    configureExchanges(channel, function(err) {
      if(err) {
        console.log(err);
      }
      configureTicker(channel, function(err) {
        if(err) {
          console.log(err);
        }
        channel.assertQueue(null, {exclusive: true}, function(err, q) {
          channel.bindQueue(q.queue, TOCK_EXCHANGE, '#');
          channel.consume(q.queue, function(message) {
            tick(channel);
            console.log('[ TOCK ]', message.fields.routingKey);
          }, {noAck: true});
        });
      });
    });
  });
});
