const http = require("http");
const _ = require("lodash");
const cuti = require("cuti");
const log4js = cuti.logger.getLogger;
const logger = log4js.getLogger("NotificationEngine");
const mongoose = require("mongoose");

var e = {};
e.init = () => {
    let userSchema = {
        _id: "user",
        definition: ["name"]
    };
    mongoose.model("entity").findOne({ _id: "user" })
        .then(_d => {
            if (!_d) {
                mongoose.model("entity").create(userSchema, err => {
                    if (!err) logger.info("User Entity :: Added");
                });
            }
        });
};

e.fetch = (entity, attribute) => {
    return new Promise((resolve, reject) => {
        var userID = entity["user"];
        var options = {
            host: "localhost",
            port: 10011,
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            path: "/usr/v1/" + entity["user"]
        };
        var userDetails = {};
        var request = http.request(options, function (res) {
            res.on("data", function (data) {
                userDetails = data;
            });
            res.on("end", function () {
                // console.log("===1==1=1", userDetails.toString());
                if (_.isEmpty(userDetails)) {
                    logger.error("User " + userID + " not found");
                    resolve(null);
                }
                // console.log("---Userdetails inside end", userDetails.toString());
                else {
                    userDetails = JSON.parse(userDetails.toString());
                    if(userDetails && userDetails[attribute])
                        resolve(userDetails[attribute]);
                    else{
                        resolve(null);
                    }    
                }
            });
        });
        request.end();
        request.on("error", function (err) {
            reject(err);
        });
    });
};

e.getUserCommunicationObject = (userID) => {
    return new Promise((resolve, reject) => {
        var options = {
            host: "localhost",
            port: 10011,
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            path: "/usr/v1/" + userID
        };
        var userDetails = {};
        var request = http.request(options, function (res) {
            res.on("data", function (data) {
                userDetails = data;
            });
            res.on("end", function () {
                // console.log("===1==1=1", userDetails.toString());
                if (_.isEmpty(userDetails)) {
                    logger.error("User " + userID + " not found");
                    resolve(null);
                }
                // console.log("---Userdetails inside end", userDetails.toString());
                else {
                    userDetails = JSON.parse(userDetails.toString());
                    var userInfo = {
                        id: userID,
                        name: userDetails.username,
                        emailID: userDetails.contact.email,
                        number: userDetails.contact.phoneNumber
                    };
                    resolve(userInfo);
                }
            });
        });
        request.end();
        request.on("error", function (err) {
            reject(err);
        });
    });
};

e.getGroupDetails = (groupID) => {
    return new Promise((resolve, reject) => {

        var options = {
            host: "localhost",
            port: 10011,
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            path: "/usr/v1/grp/" + groupID
        };
        var groupDetails = {};
        var request = http.request(options, function (res) {
            res.on("data", function (data) {
                groupDetails = data;
            });
            res.on("end", function () {
                // console.log("===1==1=1", groupDetails);
                if (_.isEmpty(groupDetails)) {
                    logger.error("Group " + groupID + " not found");
                    resolve(null);
                }
                // console.log("---groupdetails inside end", groupDetails.toString());
                else {
                    groupDetails = JSON.parse(groupDetails);
                    groupDetails = enrichGrpwithUserDetails(groupDetails);
                    resolve(groupDetails);
                }
            });
        });
        request.end();
        request.on("error", err => reject(err));
    });
};

function enrichGrpwithUserDetails(groupObj) {
    return new Promise(resolve => {
        var userPromise = groupObj["users"].map(usr => e.getUserCommunicationObject(usr));
        Promise.all(userPromise)
            .then(users => {
                groupObj["users"] = users;
                resolve(groupObj);
            });
    });
}

module.exports = e;