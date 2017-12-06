const nodemailer = require('nodemailer');
const envConfig = require("../../config/config");
var e = {};
const fs = require('fs');
const SMTPconfigFile = process.env.SMTP_FILE_PATH || 'config/SMTPConfig.json'
const SMTPconfigs = JSON.parse(fs.readFileSync(SMTPconfigFile, 'utf8'));
e.sendEmail = (message, senderObj) => {
    var smtpConfig = getSMTPConfig(senderObj)
    console.log('Sending Mail');
    return new Promise((resolve, reject) => {
        var transport = getTransport(smtpConfig);
        transport.sendMail(message, function (error) {
            // console.log("Inside sendmail");
            if (error) {
                console.log('Error occured');
                console.log(error.message);
                reject(error);
                return;
            }
            console.log('Message sent successfully!');
            transport.close();
            resolve();
        })
    })
}

function getSMTPConfig(senderObj) {
    if (Object.keys(senderObj).length !== 0) {
        const senderID = senderObj['address'];
        if (senderID && SMTPconfigs[senderID]) {
            // console.log("Email found in config File");
            return SMTPconfigs[senderID];
        }
        console.log("Could not find SMTPConfig");
        return envConfig.defaultSMTPconfig
    } else {
        // console.log("Sender object is empty");
        return envConfig.defaultSMTPconfig
    }
}

var getTransport = (SMTPconfig) => {
    var transport = nodemailer.createTransport(SMTPconfig);
    console.log('SMTP Configured');
    return transport;
}

module.exports = e;