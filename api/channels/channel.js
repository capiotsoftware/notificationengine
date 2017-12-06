"use strict";

var cuti = require("cuti");
var Mongoose = require("mongoose");
var puttu = require("puttu-redis");
var sms = require("./sms");
var queueMgmt = require("./queueMgmt");
var enrichTemplate = require("../util/enrichTemplate");
var log4js = cuti.logger.getLogger;
var logger = log4js.getLogger("NotificationEngine");
const http = require('http');
var _ = require('lodash');

var e = {};
var users = {};
var groups = {};

function generateErrorMessage(_s) {
    var err = new Error(_s);
    return err;
}

function getEvent(_id) {
    // console.log("Inside getEvent");
    return new Promise((resolve, reject) => {
        Mongoose.model('event').findOne({
            _id: _id
        }, (errFind, _d) => {
            if (errFind) reject(errFind);
            // console.log("getEvent ", _d);
            if (_d) resolve(_d);
            else reject(generateErrorMessage("No active event found with the id " + _id));
        });
    });
}

function getTemplate(_id) {
    // console.log("id was ", _id);
    return new Promise((resolve, reject) => {
        Mongoose.model('template').findOne({
            _id: _id
        }, (errFind, _d) => {
            if (errFind) reject(errFind);
            // console.log("getTemplates ", _d);
            if (_d) resolve(_d);
            else reject(generateErrorMessage("No active template found with the id " + _id));
        });
    });
}

function getSubscriptions(_id) {
    return new Promise((resolve, reject) => {
        console.log("id ", _id);
        Mongoose.model('subscription').findOne({
            _id: _id
        }, (errFind, _d) => {
            if (errFind) reject(errFind);
            // console.log("getSubscriptions ", _d);
            if (_d) resolve(_d);
            else reject(generateErrorMessage("No active subscription found with the id " + _id));
        });
    });
}

function buildTemplates(_data) {
    console.log(">>>>>>>>event data", JSON.stringify(_data, null, 4))
    return new Promise((resolve, reject) => {
        // var templates = [];
        var getTemplatePromises = [];
        _data._event.templateIDs.forEach(templateID => {
            getTemplatePromises.push(getTemplate(templateID));
        })
        Promise.all(getTemplatePromises).then(templateDataArr => {
            var templates = templateDataArr.map(templateData => {
                templateData.subject = templateData.subject ? enrichTemplate.render(templateData.subject, _data.earlyEnrichments) : null;
                templateData.body = enrichTemplate.render(templateData.body, _data.earlyEnrichments);
                return templateData;
            })
            // console.log("----------Templates",templates);
            resolve(templates);
        })
    });
}

function buildSMS(userDetail, SMSTemplate) {
    // console.log("SMSTemplate", SMSTemplate);
    SMSTemplate = SMSTemplate ? enrichTemplate.render(SMSTemplate.body, userDetail) : null;
    return {
        SMSTemplate,
        number: userDetail.number
    };
}

function buildEmailMessage(userDetail, emailTemplate, senderEmailID, attachments, type) {
    var msg = {};
    var userList = [];
    var userListPromises = [];
    if ((type === 'group')) {
        userList = userDetail['users'];
        // if (userDetail) {
        //     userListPromises = userDetail.users.map(user => {
        //         return getUserDetails(user).catch(err => err)
        //     });
        // }
    } else {
        userList.push(userDetail);
    }
    console.log("users ", userList);
    if (userList.length === 0) reject("No recipient list");
    else {
        msg['from'] = senderEmailID;
        msg['to'] = userList.filter(usr => !_.isEmpty(usr)).map(user => user.emailID)
        msg['subject'] = enrichTemplate.render(emailTemplate.subject, userDetail);
        msg['html'] = enrichTemplate.render(emailTemplate.body, userDetail);
        msg['attachments'] = attachments.map(url => {
            var obj = {};
            obj['path'] = url;
            return obj
        });
        return msg;
    }
}

function enrichGrpwithUserDetails(groupObj) {
    return new Promise((resolve, reject) => {
        var userPromise = groupObj['users'].map(usr => getUserDetails(usr));
        Promise.all(userPromise)
            .then(users => {
                groupObj['users'] = users;
                resolve(groupObj);
            })
    })
}

function getUserFromUsrMngmt(userID) {
    return new Promise((resolve, reject) => {
        var options = {
            host: 'localhost',
            port: 10011,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            path: '/usr/v1/' + userID
        };
        var userDetails = {};
        var request = http.request(options, function (res) {
            res.on('data', function (data) {
                userDetails = data;
            });
            res.on('end', function () {
                // console.log("===1==1=1", userDetails);
                if (_.isEmpty(userDetails)) {
                    logger.error("User " + userID + " not found");
                    resolve(null);
                }
                // console.log("---Userdetails inside end", userDetails.toString());
                else {
                    userDetails = JSON.parse(userDetails);
                    var userInfo = {
                        name: userDetails.username,
                        emailID: userDetails.contact.email,
                        number: userDetails.contact.phoneNumber
                    }
                    resolve(userInfo);
                }
            });
        });
        request.end();
        request.on('error', function (err) {
            console.log(err);
            reject(err);
        });
    })
}

function getUserDetails(userID) {
    console.log("userID is", userID);
    return new Promise((resolve, reject) => {
        if (users[userID]) resolve(users[userID]);
        else {
            getUserFromUsrMngmt(userID)
                .then(userInfo => {
                    users[userID] = userInfo;
                    resolve(userInfo);
                })
                .catch(err => reject(err))
        }
    })
}

function getGroupDetails(groupID) {
    console.log("groupID is", groupID);
    return new Promise((resolve, reject) => {
        if (groups[groupID]) resolve(groups[groupID]);
        else {
            var options = {
                host: 'localhost',
                port: 10011,
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                path: '/usr/v1/grp/' + groupID
            };
            var groupDetails = {};
            var request = http.request(options, function (res) {
                res.on('data', function (data) {
                    groupDetails = data;
                });
                res.on('end', function () {
                    // console.log("===1==1=1", groupDetails);
                    if (_.isEmpty(groupDetails)) {
                        logger.error("Group " + groupID + " not found");
                        resolve(null);
                    }
                    // console.log("---groupdetails inside end", groupDetails.toString());
                    else {
                        groupDetails = JSON.parse(groupDetails);
                        groupDetails = enrichGrpwithUserDetails(groupDetails)
                        resolve(groupDetails);
                    }
                });
            });
            request.end();
            request.on('error', function (err) {
                console.log(err);
                reject(err);
            });
        }
    })
}

function buildOutboundMessages(_data) {
    var messages = {};
    messages['email'] = [];
    messages['sms'] = [];
    var senderEmail = Object.keys((_data._event.email).toJSON()).length !== 0 ? _data._event['email'] : null;
    var senderNo = Object.keys((_data._event.sms).toJSON()).length !== 0 ? _data._event['sms'] : null;
    console.log("SenderEmail", senderEmail);
    console.log("senderNo", senderNo);
    return new Promise((resolve, reject) => {
        var subscriptions = {};
        subscriptions['email'] = {};
        subscriptions['sms'] = {};
        var userPromises = _data['_subscription']['recipients']
            .filter(recipient => (recipient.type === 'user'))
            .map(recipient => {
                return getUserDetails(recipient.id).catch(err => err);
            });
        var groupPromises = _data['_subscription']['recipients']
            .filter(recipient => (recipient.type === 'group'))
            .map(recipient => {
                return getGroupDetails(recipient.id).catch(err => err)
            });
        // var emailMsgPromises = [];
        var grpUserDetail = [];
        Promise.all(userPromises)
            .then(_d => {
                console.log(">>>>>>>Got all users", JSON.stringify(_d, null, 4));
                _d = _d.filter(obj => !(_.isEmpty(obj)));
                subscriptions['email']['users'] = JSON.parse(JSON.stringify(_d));
                subscriptions['sms']['users'] = JSON.parse(JSON.stringify(_d));
                _data._event['defaultRecipientList'].filter(recipient => (recipient.type === 'email')).forEach(obj => {
                    var newObj = {}
                    newObj['emailID'] = obj['destination'];
                    newObj['name'] = obj['name'];
                    subscriptions['email']['users'].push(newObj);
                })
                _data._event['defaultRecipientList'].filter(recipient => (recipient.type === 'sms')).forEach(obj => {
                    var newObj = {}
                    newObj['number'] = obj['destination'];
                    newObj['name'] = obj['name'];
                    // console.log("inside SMS newObj", newObj);
                    subscriptions['sms']['users'].push(newObj);
                })
                subscriptions['email']['users'].forEach(userDetail => {
                    _data.templates.filter(template => template.type === 'email').forEach(template => {
                        if (userDetail)
                            messages['email'].push(buildEmailMessage(userDetail, template, senderEmail, _data.attachmentURLs, 'user'))
                    })
                })
                console.log("SMS users", subscriptions['sms']['users']);
                subscriptions['sms']['users'].forEach(userDetail => {
                    _data.templates.filter(template => template.type === 'sms').forEach(template => {
                        if (userDetail)
                            messages['sms'].push(buildSMS(userDetail, template, senderNo))
                    })
                })
            })
            .then(() => Promise.all(groupPromises))
            .then(_d => {
                console.log(">>>>>>>Got all Groups");
                subscriptions['email']['groups'] = _d;
            })
            .then(() => {
                // console.log(">>>>>>>Got grp users list");
                var allGroupUserList = [];
                subscriptions['email']['groups'].forEach(grp => {
                    grp['users'].forEach(usr => {
                        allGroupUserList.push(usr);
                    })
                })
                _data.templates.forEach(template => {
                    if (template.type === 'email') {
                        if (template.isGroupMailer) {
                            subscriptions['email']['groups'].forEach(groupDetail => {
                                messages['email'].push(buildEmailMessage(groupDetail, template, senderEmail, _data.attachmentURLs, 'group'))
                            })
                        } else {
                            allGroupUserList.forEach(user => {
                                if (user) {
                                    messages['email'].push(buildEmailMessage(user, template, senderEmail, _data.attachmentURLs, 'user'))
                                }
                            })
                        }
                    } else {
                        allGroupUserList.forEach(user => {
                            if (user) {
                                messages['sms'].push(buildSMS(user, template, senderNo))
                            }
                        })
                    }
                })
            })
            .then(() => {
                resolve(messages);
            })
            .catch(err => reject(err));
    })

}

function send(_messages, event) {
    console.log("+++++++++++++++++++")
    console.log(JSON.stringify(_messages, null, 4));
    _messages.email.forEach(msg => {
        queueMgmt.queueEmail(msg, event);
    })
    _messages.sms.forEach(msg => {
        queueMgmt.queueSMS(msg, event);
    })
}

e.processMessage = function (data) {
    // data will have subscriptionID, earlyEnrichments, attachmentURLs
    users = {}; //Cleaning users info for each notify request. Storing userDetails to prevent rerequest of user from userManagement.
    groups = {}; //Cleaning groups info for each notify request. Storing groupDetails to prevent rerequest of group from userManagement.
    return getSubscriptions(data.subscriptionID)
        .then(_d => data._subscription = _d)
        .then(() => getEvent(data._subscription.eventID))
        .then(_d => data._event = _d)
        .then(() => buildTemplates(data))
        .then(_d => data.templates = _d)
        .then(() => buildOutboundMessages(data))
        .then(_d => send(_d, data._event))
};

module.exports = e;