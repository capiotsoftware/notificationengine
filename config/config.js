module.exports = {
    queueNames: {
        email: {
            p1: "emailP1Q",
            p2: "emailP2Q"
        },
        sms: {
            p1: "smsP1Q",
            p2: "smsP2Q"
        }
    },
    defaultSMTPconfig:{
        service: "Gmail",
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWD
        }
    },
    retryCounter:{
        email:1,
        sms:1
    },
    sms:{
        api_url: process.env.SMS_CONN_STRING,
        api_secret: process.env.SMS_SECRET,
        api_key: process.env.SMS_KEY
    }
};