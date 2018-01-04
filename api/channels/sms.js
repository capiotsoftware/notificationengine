var e = {};
const envConfig = require("../../config/config");
const request = require("request");

e.sendSMS = (msgObj) => {
    let reqBody = {
        from: msgObj["from"],
        to: msgObj.message["number"],
        text: msgObj.message["SMSTemplate"],
        api_secret: envConfig.sms.api_key,
        api_key: envConfig.sms.api_secret
    };
    return new Promise((resolve, reject) => {
        var options = {
            url: envConfig.sms.api_url,
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            json: true,
            body: reqBody
        };
        request.post(options, function (err, res, body) {
            if (err) reject(err);
            if (!res)
                reject(new Error("SMS service down"));
            else{
                if (res.statusCode >= 200 && res.statusCode < 300)
                    resolve(body);
                else {
                    reject(body);
                }
            }
        });
    });
};

module.exports = e;