"use strict";
const app = require("express")();
const log4js = require("log4js");
const logger = log4js.getLogger("product");
logger.level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'info';

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
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'GET', 'POST', 'PUT', 'DELETE', 'OPTIONS');
    next();
});

var data = [
    { _id: "PROD1001", "name": "Google Pixel 2", "category": "Smart Phones", "brand": "Google", "price": 100 },
    { _id: "PROD1002", "name": "Samsung TV", "category": "TV", "brand": "Samsung", "price": 200 },
    { _id: "PROD1003", "name": "Fair and Lovely 100 mg", "category": "Beauty Products", "brand": "Fair and Lovely", "price": 300 },
    { _id: "PROD1004", "name": "Ponds Face Cream 200ml", "category": "Beauty Products", "brand": "Ponds", "price": 400 },
    { _id: "PROD1005", "name": "Cello Food Safe Container 500ml", "category": "Kitchen Utensils", "brand": "Cello", "price": 500 }
];

app.get("/product/:id", function(req, res) {
    var product = null;
    data.forEach(_d => {
        if (_d._id == req.params.id) product = _d;
    });
    if (product) res.json(product);
    else res.status(400).json({ "message": "Product not found!" });
});

function start(_port) {
    app.listen(_port, (err) => {
        if (!err) {
            logger.info("PRODUCT server started on port " + _port);
        } else
            logger.error(err);
    });
}

module.exports = start;