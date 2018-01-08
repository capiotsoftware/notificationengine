"use strict";
const SwaggerExpress = require("swagger-express-mw");
const express = require("express");
const app = express();
const morgan = require('morgan')
var log4js = require("log4js");
const logger = log4js.getLogger("notificationEngine");
logger.level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'info';
const bluebird = require("bluebird");
const mongoose = require("mongoose");
const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/notificationEngine";
const integration = require("./api/integrations/init");
const inquirer = require("inquirer");
const prompt = inquirer.createPromptModule();
const fs = require('fs');
var ncp = require('ncp').ncp;
ncp.limit = 32;
var questions = [];
questions.push({
    type: "list",
    name: "ui",
    message: "Select UI component you wish to generate.",
    default: "all",
    choices: ["all", "entities", "events", "subscriptions", "templates"]
});
questions.push({
    type: "input",
    name: "path",
    message: "Enter the path where you want to generate UI component",
    default: "../UIComponent"
});

const startService = () => {
    morgan('[:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"');
    app.use(morgan('combined'));

    global.Promise = bluebird;
    global.logger = logger;
    mongoose.Promise = global.Promise;

    if (process.env.SERVICES) {
        app.use("/ui", express.static("ui"));
        require("./supportServices/user")(10011);
        require("./supportServices/product")(10012);
        require("./supportServices/smsGateway")(10013);
    }

    mongoose.connect(mongoUrl, {
        useMongoClient: true
    }, err => {
        if (err) {
            logger.error(err);
        } else {
            logger.info("Connected to DB");
            integration.init();
        }
    });

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

    var config = {
        appRoot: __dirname
    };
    module.exports = app;

    SwaggerExpress.create(config, function (err, swaggerExpress) {
        if (err) {
            throw err;
        }

        swaggerExpress.register(app);

        var port = process.env.PORT || 10010;
        app.listen(port, (err) => {
            if (!err) logger.info("Server started on port " + port);
            else logger.error(err);
        });

    });
}

if (process.argv.length > 2 && process.argv.indexOf("-g") > 0) {
    prompt(questions)
        .then(result => {
            var dir = result['path'];
            if (!fs.existsSync(dir)) try {
                fs.mkdirSync(dir)
            } catch (e) {
                console.error(e);
            }
            if (result['ui'] == 'all') {
                ncp('./uiSamples/', dir, function (err) {
                    if (err) return console.error(err);
                    console.log('UI components created');
                });
            } else {
                dir += '/' + result['ui'];
                if (!fs.existsSync(dir)) fs.mkdirSync(dir);
                ncp('./uiSamples/' + result['ui'], dir, function (err) {
                    if (err) return console.error(err);
                    console.log('UI components created');
                });
            }
        })
        .then(() => startService());
}

else if (process.argv.length > 2 && process.argv.indexOf("-h") > 0) {
    console.log(`Notification Engine is a service which will send notification to its subscribers. It will manages templates and subscriptions, and when an event is triggered the required set of notifications will to be the recipients.`);
    console.log(`\nargs supported:\n1. -g: Generates UI components\n2. -h: help`);
    startService();
}