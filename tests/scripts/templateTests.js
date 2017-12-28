var winston = require("winston");

function getDateTime() {
    var sd = new Date();
    var syear = sd.getFullYear();
    var smonth = ("0" + (sd.getMonth() + 1)).slice(-2);
    var sdate = ("0" + sd.getDate()).slice(-2);
    var shours = ("0" + sd.getHours()).slice(-2);
    var sminutes = ("0" + sd.getMinutes()).slice(-2);
    var sseconds = ("0" + sd.getSeconds()).slice(-2);
    var startDate = syear + "-" + smonth + "-" + sdate;
    var startTime = shours + "-" + sminutes + "-" + sseconds;
    return startDate + "_" + startTime;
}
var logger = new(winston.Logger)({
    transports: [new(winston.transports.File)({
        filename: "logs/Log_" + getDateTime() + "_templateTests.json.log"
    })]
});
var expect = require("chai").expect;
var assert = require("chai").assert;
var api1 = require("supertest")("http://localhost:10010/ne");
var api2 = require("supertest")("http://localhost:10011/usr");
describe("Sample API Tests", function () {
    function compareJson(_this, _that) {
        for (_k_this in _this) {
            if (!compare(_this[_k_this], _that[_k_this])) return false;
        }
        return true;
    }

    function compareArrays(_this, _that) {
        if (_this.length == 0 && _that.length == 0) return true;
        if (_this.length == 0 && _that.length != 0) return false;
        for (var i = 0; i < _this.length; i++) {
            return compare(_this[i], _that[i]);
        }
    }

    function compare(o1, o2) {
        if (Object.prototype.toString.call(o1) == "[object Object]" && Object.prototype.toString.call(o2) == "[object Object]") {
            return compareJson(o1, o2);
        }
        if (Object.prototype.toString.call(o1) == "[object Array]" && Object.prototype.toString.call(o2) == "[object Array]") {
            return compareArrays(o1, o2);
        }
        if (o1 != o2) {
            return false;
        }
        return true;
    }
    var loginResponse = "";
    it("Login", function (done) {
        logger.info("Title: Login");
        var request = api2.post("/login").send({
            "username": "admin",
            "password": "password"
        }).expect(200).end(function (err, res) {
            logger.info("Request");
            logger.info(res.request.method, res.request.url, res.request.header, res.request._data);
            logger.info("Response");
            logger.info(res.res.statusCode, res.res.headers, res.res.body);
            try {
                expect(res.status).to.equal(200);
                loginResponse = res.body;
                logger.info("Login :: PASS");
            } catch (_err) {
                logger.error(_err.message);
                logger.info("Login :: FAIL");
                assert.fail(_err.actual, _err.expected, _err.message);
            }
            done();
        });
    });
    it("Fetch Templates", function (done) {
        logger.info("Title: Fetch Templates");
        api1.get("/template").set("Authorization", "JWT " + loginResponse.token).expect(200).end(function (err, res) {
            logger.info("Request");
            logger.info(res.request.method, res.request.url, res.request.header, res.request._data);
            logger.info("Response");
            logger.info(res.res.statusCode, res.res.headers, res.res.body);
            try {
                expect(res.status).to.equal(200);
                logger.info("Fetch Templates :: PASS");
            } catch (_err) {
                logger.error(_err.message);
                logger.info("Fetch Templates :: FAIL");
                assert.fail(_err.actual, _err.expected, _err.message);
            }
            done();
        });
    });
});