"use strict";
const app = require("express")();
const log4js = require("log4js");
const logger = log4js.getLogger("user");


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

var users = [
    {_id: "USR1001", "name": "Alice", "contact": {"phoneNumber": "+91 99123 11111", "email": "jerrycapiot@gmail.com"}},
    {_id: "USR1002", "name": "Bob", "contact": {"phoneNumber": "+91 99123 22222", "email": "jerrycapiot@gmail.com"}},
    {_id: "USR1003", "name": "Charlie", "contact": {"phoneNumber": "+91 99123 33333", "email": "jerrycapiot@gmail.com"}},
    {_id: "USR1004", "name": "David", "contact": {"phoneNumber": "+91 99123 44444", "email": "jerrycapiot@gmail.com"}},
    {_id: "USR1005", "name": "Eli", "contact": {"phoneNumber": "+91 99123 55555", "email": "jerrycapiot@gmail.com"}}
];

var groups = [
    {"name": "GRP1001", "users": ["USR1001", "USR1002"]},
    {"name": "GRP1002", "users": ["USR1002", "USR1003"]},
    {"name": "GRP1003", "users": ["USR1004", "USR10010"]},
    {"name": "GRP1004", "users": ["USR1006", "USR1007"]}
];

app.get("/user/:id", function (req, res) {
    var user = null;
    users.forEach(_d => {
        if(_d._id == req.params.id) user = _d;
    });
    if(user) res.json(user);
    else res.status(400).json({"message": "User not found!"});
});

app.get("/group/:id", function (req, res) {
    var group = null;
    groups.forEach(_d => {
        if(_d._id == req.params.id) group = _d;
    });
    if(group) res.json(group);
    else res.status(400).json({"message": "Group not found!"});
});

function start(_port) {
    app.listen(_port, (err) => {
        if (!err) {
            logger.info("USER Server started on port " + _port);
        } else
            logger.error(err);
    });
}

module.exports = start;