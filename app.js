"use strict";
const SwaggerExpress = require("swagger-express-mw");
const app = require("express")();
const http = require("http");
const cuti = require("cuti");
const log4js = cuti.logger.getLogger;
const logger = log4js.getLogger("NotificationEngine");
const bluebird = require("bluebird");
const mongoose = require("mongoose");
const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/notificationEngine";
const puttu = require("puttu-redis");
const redis = require("redis");
const util = require("util");
const client = redis.createClient();
const integration = require('./api/integrations/init');

client.on("error", function (err) {
    logger.error("Redis Disconnected, stopping service");
    process.exit(0);
});

puttu.init(client);
cuti.init("ne");

global.Promise = bluebird;
global.logger = logger;
mongoose.Promise = global.Promise;
// mongoose.set("debug", true);

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
    if (err) { throw err; }

    swaggerExpress.register(app);

    var port = process.env.PORT || 10010;
    app.listen(port, (err) => {
        if (!err) {
            puttu.register("ne", {
                protocol: "http",
                port: port,
                api: "/ne"
            }).catch(err => logger.error(err));

            logger.info("Server started on port " + port);
        } else
            logger.error(err);
    });

});