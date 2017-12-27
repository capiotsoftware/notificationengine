"use strict";
const amqp = require('amqplib/callback_api');
const util = require('util');
const email = require('./email');
const sms = require('./sms');
const envConfig = require("../../config/config");
var cuti = require("cuti");
var log4js = cuti.logger.getLogger;
var logger = log4js.getLogger("NotificationEngine");
var queueEmailP1 = envConfig.queueNames.email.p1;
var queueEmailP2 = envConfig.queueNames.email.p2;
var queueSMSP1 = envConfig.queueNames.sms.p1;
var queueSMSP2 = envConfig.queueNames.sms.p2;
var chEmailP1 = null;
var chEmailP2 = null;
var chSMSP1 = null;
var chSMSP2 = null;

function getChannel(priority, type) {
    var ch = null;
    if (type === 'email') {
        ch = priority === 1 ? chEmailP1 : chEmailP2
    } else if (type === 'sms') {
        ch = priority === 1 ? chSMSP1 : chSMSP2
    }
    if (ch) return new Promise(resolve => {
        resolve(ch)
    });
    else {
        ch = createChannel(priority, type);
        if (type === 'email') {
            priority === 1 ? chEmailP1 = ch : chEmailP2 = ch;
        } else if (type === 'sms') {
            priority === 1 ? chSMSP1 = ch : chSMSP2 = ch;
        }
        return new Promise(resolve => {
            resolve(ch)
        });
    }
}

function getQueue(priority, type) {
    var q = null;
    if (type === 'email') {
        q = priority === 1 ? queueEmailP1 : queueEmailP2
    } else if (type === 'sms') {
        q = priority === 1 ? queueSMSP1 : queueSMSP2
    }
    return q;
}

function createChannel(priority, type) {
    var q = getQueue(priority, type);
    return new Promise((resolve, reject) => {
        amqp.connect(envConfig.connectionStrings.amqp, function (err, conn) {
            if (err) reject(err);
            if (conn) {
                conn.createChannel(function (err, ch) {
                    if (err) reject(err);
                    ch.assertQueue(q, {
                        durable: false
                    });
                    resolve(ch);
                });
            }
        });
    })
}

var e = {};


e.queueEmail = (message, event) => {
    var q = event.priority === 1 ? queueEmailP1 : queueEmailP2;
    var obj = {};
    obj['message'] = message;
    obj['email'] = event.email;
    obj['retryCounter'] = 0;
    // console.log("event", event);
    getChannel(event.priority, 'email')
        .then(ch => {
            logger.info("Adding Email to Q");
            ch.sendToQueue(q, new Buffer(JSON.stringify(obj, null, 4)));
        })
        .catch(err => {
            console.log(err);
            logger.error(err.message);
            throw new Error(err);
        });
}

e.queueSMS = (message, event) => {
    var q = event.priority === 1 ? queueSMSP1 : queueSMSP2;
    var obj = {};
    obj['message'] = message;
    obj['from'] = event.sms.number;
    obj['retryCounter'] = 0;
    // console.log("event", event);
    getChannel(event.priority, 'sms')
        .then(ch => {
            logger.info("Adding SMS to Q");
            ch.sendToQueue(q, new Buffer(JSON.stringify(obj, null, 4)));
        })
        .catch(err => {
            console.log(err);
            throw new Error(err);
        });
}


function requeue(msgObj, type) {
    var q = type === 'email' ? queueEmailP1 : queueSMSP1;
    console.log("----------Requeuing " + type + "---------");
    msgObj['retryCounter'] += 1;
    if (msgObj['retryCounter'] > envConfig.retryCounter[type]) {
        logger.error(type + " failed permanently");
        return;
    }
    getChannel(1, type).then(ch => {
        ch.sendToQueue(q, new Buffer(JSON.stringify(msgObj, null, 4)));
    });
}

function sendEmailP2() {
    var q = queueEmailP2;
    createChannel(2, 'email')
        .then(ch => {
            ch.consume(q, function (msg) {
                // console.log("Email P2 Msg is ", msg.content.toString('utf8'))
                var msgObj = JSON.parse(msg.content.toString('utf8'));
                ch.ack(msg);
                email.sendEmail(msgObj['message'], msgObj['email'])
                    .then(() => {
                        // do nothing
                        console.log("Email sent");
                    }, err => {
                        logger.error(err.message)
                    })
            }, {
                noAck: false
            });
        }).catch(err => {
            console.log(err.message);
        })
}

function sendEmailP1() {
    var q = queueEmailP1;
    createChannel(1, 'email')
        .then(ch => {
            ch.consume(q, function (msg) {
                // console.log("Email P1 Msg is ", msg.content.toString('utf8'));
                var msgObj = JSON.parse(msg.content.toString('utf8'));
                logger.info("Email, Attempt No ", msgObj['retryCounter']);
                email.sendEmail(msgObj['message'], msgObj['email'])
                    .then(() => {
                        // do nothing
                        console.log("Email sent");
                    }, err => {
                        requeue(msgObj, 'email');
                        logger.error(err.message)
                    })
                ch.ack(msg);
            }, {
                noAck: false
            });
        })
        .catch(err => {
            console.log(err);
        })
}

function sendSMSP1() {
    var q = queueSMSP1;
    createChannel(1, 'sms')
        .then(ch => {
            ch.consume(q, function (msg) {
                // console.log("SMS P1 Msg is ", msg.content.toString('utf8'));
                var msgObj = JSON.parse(msg.content.toString('utf8'));
                logger.info("SMS, Attempt No ", msgObj['retryCounter']);
                sms.sendSMS(msgObj).then(() => {
                    // do nothing
                    console.log("SMS sent");
                }, err => {
                    requeue(msgObj, 'sms');
                    console.log(err.message)
                })
                ch.ack(msg);
            }, {
                noAck: false
            });
        })
        .catch(err => {
            logger.error(err.message);
        })
}

function sendSMSP2() {
    var q = queueSMSP2;
    createChannel(2, 'sms')
        .then(ch => {
            ch.consume(q, function (msg) {
                // console.log("SMS P2 Msg is ", msg.content.toString('utf8'));
                var msgObj = JSON.parse(msg.content.toString('utf8'));
                sms.sendSMS(msgObj).then(() => {
                    // do nothing
                    console.log("SMS sent");
                }, err => {
                    console.log(err.message)
                });
                ch.ack(msg);
            }, {
                noAck: false
            });
        }, err => {
            throw err
        })
        .catch(err => {
            logger.error(err.message);
        })
}

sendEmailP1();
sendEmailP2();
sendSMSP1();
sendSMSP2();
module.exports = e;