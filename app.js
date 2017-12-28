"use strict";
const SwaggerExpress = require("swagger-express-mw");
const app = require("express")();
const morgan = require('morgan')
var log4js = require("log4js");
log4js.levels.forName("OFF",Number.MAX_VALUE-1);
log4js.levels.forName("AUDIT",Number.MAX_VALUE);
const logger = log4js.getLogger("notificationEngine");
const bluebird = require("bluebird");
const mongoose = require("mongoose");
const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/notificationEngine";
const integration = require("./api/integrations/init");

morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"');
app.use(morgan('combined'));

global.Promise = bluebird;
global.logger = logger;
mongoose.Promise = global.Promise;

if(process.env.SERVICES){
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
    if (err) { throw err; }

    swaggerExpress.register(app);

    var port = process.env.PORT || 10010;
    app.listen(port, (err) => {
        if (!err) logger.info("Server started on port " + port);
        else logger.error(err);
    });

});