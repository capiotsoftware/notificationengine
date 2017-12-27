var e = {};
const cuti = require("cuti");
const log4js = cuti.logger.getLogger;
const logger = log4js.getLogger("NotificationEngine");
const mongoose = require("mongoose");
const http = require('http');
const _ = require('lodash');
e.init = () => {
    product = {
        _id: "product",
        definition: ["name", "description", "price"]
    }
    mongoose.model('entity').findOne({
            _id: 'product'
        })
        .then(_d => {
            if (!_d) {
                mongoose.model('entity').create(product, (err, doc) => {
                    if (!err) {
                        logger.info("Product Entity :: Added")
                    }
                })
            } else {
                logger.info("Product Entity :: Exist");
            }
        })
}

e.fetch = (entity, attribute) => {
    console.log("entity in product is ",entity);
    return new Promise((resolve, reject) => {
        var options = {
            host: 'localhost',
            port: 10013,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            path: '/product/' + entity['productId']
        };
        var productDetails = {};
        var request = http.request(options, function (res) {
            res.on('data', function (data) {
                productDetails = data;
            });
            res.on('end', function () {
                if (_.isEmpty(productDetails)) {
                    logger.error("product " + entity['productid'] + " not found");
                    resolve(null);
                } else {
                    try {
                        productDetails = JSON.parse(productDetails.toString());
                        resolve(productDetails[attribute]);
                    } catch (e) {
                        resolve(null);
                    }
                }
            });
        });
        request.end();
        request.on('error', function (err) {
            reject(err);
        });
    })
}

module.exports = e;