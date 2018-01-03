"use strict";
const amqp = require("amqplib/callback_api");
const email = require("./email");
const sms = require("./sms");
const envConfig = require("../../config/config");
const logger = global.logger;
var queueEmailP1 = envConfig.queueNames.email.p1;
var queueEmailP2 = envConfig.queueNames.email.p2;
var queueSMSP1 = envConfig.queueNames.sms.p1;
var queueSMSP2 = envConfig.queueNames.sms.p2;
var chEmailP1 = null;
var chEmailP2 = null;
var chSMSP1 = null;
var chSMSP2 = null;

const amqpURL = process.env.RABBIT_URL || "amqp://localhost";

function getChannel(priority, type) {
    var ch = null;
    if (type === "email") {
        ch = priority === 1 ? chEmailP1 : chEmailP2;
    } else if (type === "sms") {
        ch = priority === 1 ? chSMSP1 : chSMSP2;
    }
    if (ch) return new Promise(resolve => {
        resolve(ch);
    });
    else {
        ch = createChannel(priority, type);
        if (type === "email") {
            priority === 1 ? chEmailP1 = ch : chEmailP2 = ch;
        } else if (type === "sms") {
            priority === 1 ? chSMSP1 = ch : chSMSP2 = ch;
        }
        return new Promise(resolve => {
            resolve(ch);
        });
    }
}

function getQueue(priority, type) {
    var q = null;
    if (type === "email") {
        q = priority === 1 ? queueEmailP1 : queueEmailP2;
    } else if (type === "sms") {
        q = priority === 1 ? queueSMSP1 : queueSMSP2;
    }
    return q;
}

function createChannel(priority, type) {
    var q = getQueue(priority, type);
    return new Promise((resolve, reject) => {
        amqp.connect(amqpURL, function (err, conn) {
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
    });
}

var e = {};


e.queueEmail = (message, event) => {
    var q = event.priority === 1 ? queueEmailP1 : queueEmailP2;
    var obj = {};
    obj["message"] = message;
    obj["email"] = event.email;
    obj["retryCounter"] = 1;
    getChannel(event.priority, "email")
        .then(ch => {
            logger.info("Adding Email to Q: ",q);
            ch.sendToQueue(q, new Buffer(JSON.stringify(obj, null, 4)));
        })
        .catch(err => {
            logger.error(err.message);
            throw new Error(err);
        });
};

e.queueSMS = (message, event) => {
    var q = event.priority === 1 ? queueSMSP1 : queueSMSP2;
    var obj = {};
    obj["message"] = message;
    obj["from"] = event.sms.number;
    obj["retryCounter"] = 1;
    getChannel(event.priority, "sms")
        .then(ch => {
            logger.info("Adding SMS to Q: ",q);
            ch.sendToQueue(q, new Buffer(JSON.stringify(obj, null, 4)));
        })
        .catch(err => {
            logger.error(err);
            throw new Error(err);
        });
};


function requeue(msgObj, type, priority) {
    var q = getQueue(priority, type);
    msgObj["retryCounter"] += 1;
    let retryCounter = priority === 1 ? envConfig.retryCounter[type]['p1'] : envConfig.retryCounter[type]['p2']
    if (msgObj["retryCounter"] > retryCounter) {
        logger.error(type + " failed permanently");
        return;
    }
    getChannel(priority, type).then(ch => {
        ch.sendToQueue(q, new Buffer(JSON.stringify(msgObj, null, 4)));
    });
}

function sendEmailP2() {
    var q = queueEmailP2;
    createChannel(2, "email")
        .then(ch => {
            ch.consume(q, function (msg) {
                var msgObj = JSON.parse(msg.content.toString("utf8"));
                ch.ack(msg);
                logger.info("Email, Attempt No ", msgObj["retryCounter"]);
                email.sendEmail(msgObj["message"], msgObj["email"])
                    .then(() => {
                        logger.info("Email sent successfully!");
                    }, err => {
                        logger.error(err.message);
                        requeue(msgObj, "email", 2);
                    });
            }, {
                noAck: false
            });
        }).catch(err => {
            logger.error(err.message);
        });
}

function sendEmailP1() {
    var q = queueEmailP1;
    createChannel(1, "email")
        .then(ch => {
            ch.consume(q, function (msg) {
                var msgObj = JSON.parse(msg.content.toString("utf8"));
                logger.info("Email, Attempt No ", msgObj["retryCounter"]);
                email.sendEmail(msgObj["message"], msgObj["email"])
                    .then(() => {
                        logger.info("Email sent successfully!");
                    }, err => {
                        requeue(msgObj, "email", 1);
                        logger.error(err.message);
                    });
                ch.ack(msg);
            }, {
                noAck: false
            });
        })
        .catch(err => {
            logger.error(err);
        });
}

function sendSMSP1() {
    var q = queueSMSP1;
    createChannel(1, "sms")
        .then(ch => {
            ch.consume(q, function (msg) {
                var msgObj = JSON.parse(msg.content.toString("utf8"));
                logger.info("SMS, Attempt No ", msgObj["retryCounter"]);
                sms.sendSMS(msgObj).then(() => {
                    logger.info("SMS sent");
                }, err => {
                    requeue(msgObj, "sms", 1);
                    logger.error(err.message);
                });
                ch.ack(msg);
            }, {
                noAck: false
            });
        })
        .catch(err => {
            logger.error(err.message);
        });
}

function sendSMSP2() {
    var q = queueSMSP2;
    createChannel(2, "sms")
        .then(ch => {
            ch.consume(q, function (msg) {
                var msgObj = JSON.parse(msg.content.toString("utf8"));
                logger.info("SMS, Attempt No ", msgObj["retryCounter"]);
                sms.sendSMS(msgObj).then(() => {
                    logger.info("SMS sent");
                }, err => {
                    logger.error(err.message);
                    requeue(msgObj, "sms", 2);
                });
                ch.ack(msg);
            }, {
                noAck: false
            });
        }, err => {
            throw err;
        })
        .catch(err => {
            logger.error(err.message);
        });
}

sendEmailP1();
sendEmailP2();
sendSMSP1();
sendSMSP2();
module.exports = e;