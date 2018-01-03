"use strict";
const app = require("express")();
const log4js = require("log4js");
const logger = log4js.getLogger("smsgw");

var counter = 0;
var logMiddleware = (req, res, next) => {
    var reqId = counter++;
    if (reqId == Number.MAX_VALUE) {
        reqId = counter = 0;
    }

    logger.info(reqId + " " + req.ip + " " + req.method + " " + req.originalUrl);
    next();
    logger.trace(reqId + " Sending Response");
};
app.use(logMiddleware);
app.use(function(req, res, next){
    res.header('Access-Control-Allow-Origin','*');
    res.header('Access-Control-Allow-Headers','Content-Type');
    res.header('Access-Control-Allow-Methods','GET','POST','PUT','DELETE','OPTIONS');
    next();
});

const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.post("/sendSMS", function (req, res) {
    if (req.body) {
        new Promise((resolve, reject) => {
                
            validateKeys(["from", "text", "to", "api_key", "api_secret"], req.body, reject);
            resolve({
                message: "SMS receipt"
            });
        })
            .then(result => {
                logger.info("SMS: ", req.body);
                res.send(result);
            })
            .catch(err => res.status(400).json(err.message) );
    } else res.status(500).send("Something went wrong");
});

function validateKeys(keys, obj, reject) {
    keys.forEach(key => {
        if (!obj[key]) {
            reject(new Error("require '" + key + "' to send SMS"));
            return;
        }
    });
}

function start(_port) {
    app.listen(_port, (err) => {
        if (!err) {
            logger.info("SMS Gateway started on port " + _port);
        } else
            logger.error(err);
    });
}

module.exports = start;