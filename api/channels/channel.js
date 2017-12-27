"use strict";

const cuti = require("cuti");
const Mongoose = require("mongoose");
const puttu = require("puttu-redis");
const sms = require("./sms");
const queueMgmt = require("./queueMgmt");
const enrichTemplate = require("../util/enrichTemplate");
const log4js = cuti.logger.getLogger;
const logger = log4js.getLogger("NotificationEngine");
const http = require('http');
const envConfig = require("../../config/config");
const _ = require('lodash');
const debugFlag = process.env.DEBUG || false;
const userMngmt = require('../integrations/user');

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
        if (debugFlag)
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

function createTemplatePromise(templateData, earlyEnrichments) {
    return new Promise((resolve, reject) => {
        var subjectPromise = templateData.subject ? enrichTemplate.render(templateData.subject, earlyEnrichments) : Promise.resolve(null);
        var bodyPromise = enrichTemplate.render(templateData.body, earlyEnrichments);
        subjectPromise
            .then(subject => {
                templateData.subject = subject;
            })
            .then(() => bodyPromise)
            .then(body => {
                templateData.body = body;
                resolve(templateData);
            })
    })
}

function buildTemplates(_data) {
    if (debugFlag)
        console.log(">>>>>>>>event data", JSON.stringify(_data, null, 4));
    return new Promise((resolve, reject) => {
        // var templates = [];
        var getTemplatePromises = [];
        _data._event.templateIDs.forEach(templateID => {
            getTemplatePromises.push(getTemplate(templateID));
        })
        var enrichTemplatePromises = [];
        Promise.all(getTemplatePromises)
            .then(templateDataArr => {
                templateDataArr.forEach(templateData => {
                    enrichTemplatePromises.push(createTemplatePromise(templateData, _data.earlyEnrichments));
                });
            })
            .then(() => Promise.all(enrichTemplatePromises))
            .then(templates => {
                resolve(templates)
            });
    });
}

function buildSMS(userDetail, SMSTemplate, entity) {
    return new Promise((resolve, reject) => {
        if (SMSTemplate) {
            entity['user'] = userDetail['id'];
            enrichTemplate.render(SMSTemplate.body, entity)
                .then(temp => {
                    SMSTemplate = temp;
                    resolve({
                        SMSTemplate,
                        number: userDetail.number
                    });
                })
        } else {
            resolve(null);
        }
    })

}


function buildEmailMessage(userDetail, emailTemplate, senderEmailID, attachments, type, entity) {
    var msg = {};
    var userList = [];
    return new Promise((resolve, reject) => {
        if ((type === 'group')) {
            userList = userDetail.filter(user => (user));
        } else {
            userList.push(userDetail);
            entity['user'] = userDetail['id'];
        }
        if (debugFlag)
            console.log("users ", userList);
        if (userList.length === 0) {
            logger.info("No recipient list");
            resolve(null);
        } else {
            msg['from'] = senderEmailID;
            msg['bcc'] = userList.filter(usr => !_.isEmpty(usr)).map(user => user.emailID)
            msg['attachments'] = attachments.map(url => {
                var obj = {};
                obj['path'] = url;
                return obj
            });
            // var bodyPromise = enrichTemplate.render(emailTemplate.body, userDetail);

            enrichTemplate.render(emailTemplate.subject, entity)
                .then(subject => msg['subject'] = subject)
                .then(() => enrichTemplate.render(emailTemplate.body, entity))
                .then(body => msg['html'] = body)
                .then(() => {
                    resolve(msg)
                });
        }
    })

}

function getUserDetails(userID) {
    if (debugFlag)
        console.log("userID is", userID);
    return new Promise((resolve, reject) => {
        if (users[userID]) resolve(users[userID]);
        else {
            userMngmt.getUserCommunicationObject(userID)
                .then(userInfo => {
                    users[userID] = userInfo;
                    resolve(userInfo);
                })
                .catch(err => reject(err))
        }
    })
}

function getGroupDetails(groupID) {
    if (debugFlag)
        console.log("groupID is", groupID);
    return new Promise((resolve, reject) => {
        if (groups[groupID]) resolve(groups[groupID]);
        else {
            userMngmt.getGroupDetails(groupID)
                .then(groupObj => {
                    groups[groupID] = groupObj;
                    resolve(groupObj);
                })
                .catch(err => reject(err))
        }
    })
}

function buildOutboundMessages(_data) {
    var messages = {};
    messages['email'] = [];
    messages['sms'] = [];
    var senderEmail = Object.keys((_data._event.email).toJSON()).length !== 0 ? _data._event['email'] : null;
    var senderNo = Object.keys((_data._event.sms).toJSON()).length !== 0 ? _data._event['sms'] : null;
    if (debugFlag) {
        console.log("SenderEmail", senderEmail);
        console.log("senderNo", senderNo);
    }
    return new Promise((resolve, reject) => {
            var subscriptions = {};
            subscriptions['email'] = {};
            subscriptions['sms'] = {};
            var userPromises = _data['_subscription']['recipients']
                .filter(recipient => (recipient.type === 'user'))
                .map(recipient => {
                    return getUserDetails(recipient.id);
                });
            var groupPromises = _data['_subscription']['recipients']
                .filter(recipient => (recipient.type === 'group'))
                .map(recipient => {
                    return getGroupDetails(recipient.id).catch(err => err)
                });
            // var emailMsgPromises = [];
            var grpUserDetail = [];
            var emailMsgPromise = [];
            var SMSPromise = [];
            Promise.all(userPromises)
                .then(_d => {
                    if (debugFlag)
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

                    if (debugFlag)
                        console.log("SMS users", subscriptions['sms']['users']);
                })
                .then(() => Promise.all(groupPromises))
                .then(_d => {
                    if (debugFlag)
                        console.log(">>>>>>>Got all Groups");
                    subscriptions['email']['groups'] = _d;
                })
                .then(() => {
                        // console.log(">>>>>>>Got grp users list");
                        var allUserListEmail = subscriptions['email']['users'];
                        var allUserListSms = subscriptions['sms']['users'];
                        subscriptions['email']['groups'].forEach(grp => {
                            if (grp)
                                grp['users'].forEach(usr => {
                                    allUserListEmail.push(usr);
                                    allUserListSms.push(usr);
                                })
                        })
                        if (debugFlag) {
                            console.log("All user List SMS", allUserListSms);
                            console.log("All user list Email", allUserListEmail);
                        }
                        _data.templates.forEach(template => {
                                if (template.type === 'email') {
                                    if (template.isGroupMailer) {
                                    emailMsgPromise.push(buildEmailMessage(allUserListEmail, template, senderEmail, _data.attachmentURLs, 'group', JSON.parse(JSON.stringify(_data.entity))))
                                } else {
                                    allUserListEmail.forEach(user => {
                                        if (user) {
                                            emailMsgPromise.push(buildEmailMessage(user, template, senderEmail, _data.attachmentURLs, 'user', JSON.parse(JSON.stringify(_data.entity))))
                                        }
                                    })
                                }
                            } else {
                                allUserListSms.forEach(user => {
                                    if (user) {
                                        SMSPromise.push(buildSMS(user, template, JSON.parse(JSON.stringify(_data.entity))))
                                    }
                                })
                            }
                        })
                })
        .then(() => Promise.all(emailMsgPromise))
        .then(emailMsg => messages['email'] = emailMsg)
        .then(() => Promise.all(SMSPromise))
        .then(SMS => messages['sms'] = SMS)
        .then(() => {
            resolve(messages);
        })
        .catch(err => {
            reject(err)
        });
    })

}

function send(_messages, event) {
    if (debugFlag) {
        console.log("+++++++++++++++++++")
        console.log(JSON.stringify(_messages, null, 4));
    }
    _messages.email.forEach(msg => {
        queueMgmt.queueEmail(msg, event);
    })
    _messages.sms.forEach(msg => {
        queueMgmt.queueSMS(msg, event);
    })
}

e.processMessage = function (data) {
    // data will have subscriptionID, earlyEnrichments, attachmentURLs, entity
    users = {}; //Cleaning users info for each notify request. Storing userDetails to prevent rerequest of user from userManagement.
    groups = {}; //Cleaning groups info for each notify request. Storing groupDetails to prevent rerequest of group from userManagement.
    return getSubscriptions(data.subscriptionID)
        .then(_d => data._subscription = _d)
        .then(() => getEvent(data._subscription.eventID))
        .then(_d => data._event = _d)
        .then(() => buildTemplates(data))
        .then(_d => data.templates = _d)
        .then(() => buildOutboundMessages(data))
        .then(_d => send(_d, data._event));
};

module.exports = e;