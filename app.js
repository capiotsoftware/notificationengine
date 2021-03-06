"use strict";
const startOptions = require('./uiSamples/uiSample');
if (process.argv[2] == "-g") {
    startOptions.generateUI();
    return;
} else if (process.argv[2] == "-h") startOptions.help();
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

SwaggerExpress.create(config, function(err, swaggerExpress) {
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