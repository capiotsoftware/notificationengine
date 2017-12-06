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

app.use(function (_req, _res, next) {
    if (_req.method == "OPTIONS") next();
    else if (_req.headers["authorization"]) {
        cuti.request.getUrlandMagicKey("usr").then(options => {
            options.path = "/usr/validate";
            options.headers = {
                "authorization": _req.headers["authorization"],
                "content-type": "application/json"
            };
            var request = http.request(options, function (res) {
                var body = [];
                res.on('data', function (data) {
                    body.push(data);
                });
                res.on('end', function () {
                    var data = body.join('');
                    if (JSON.parse(data).message) _res.status(401).json(JSON.parse(data));
                    else {
                        _req.user = data;
                        next();
                    }
                });
            });
            request.end();
            request.on('error', function (err) {
                console.log(err);
            });
        });
    } else if (_req.headers.magickey) {
        puttu.getMagicKey("adv").then(key => key == _req.headers.magickey ? next() : _res.status(401).json({ message: "Unauthorized" }));
    } else {
        _res.status(401).json({ message: "Unauthorized" });
    }
});

function getPermissionString(contoller) {
    switch (contoller) {
        case 'template':
            return 'canManageTemplates';
        case 'event':
            return 'canManageEvents';
        case 'subscribe':
            return 'canManageSubscriptions';
        case 'notify':
            return 'isAllowedToSendNotifications';
        default:
            return new Error("controller not valid");
    }
}
app.use(function (req, res, next) {
    var contollers = ['template', 'event', 'subscribe', 'notify'];
    var permissions = JSON.parse(req.user).permissions;
    contollers.forEach(el => {
        if (req.originalUrl && req.originalUrl.indexOf(el) != -1) {
            if (permissions[getPermissionString(el)])
                next();
            else { res.status(401).json({ message: "Access denied" }); }
        }
    })
    // next(new Error("Unknown API for permission check"));
});

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