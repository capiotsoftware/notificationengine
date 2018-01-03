const nodemailer = require("nodemailer");
const envConfig = require("../../config/config");
const logger = global.logger;
var e = {};

e.sendEmail = message => {
    var smtpConfig = envConfig.defaultSMTPconfig;
    return new Promise((resolve, reject) => {
        var transport = getTransport(smtpConfig);
        transport.sendMail(message, function (error) {
            if (error) {
                logger.error(error.message);
                reject(error);
                return;
            }
            transport.close();
            resolve();
        });
    });
};

var getTransport = (SMTPconfig) => {
    var transport = nodemailer.createTransport(SMTPconfig);
    logger.info("SMTP Configured");
    return transport;
};

module.exports = e;