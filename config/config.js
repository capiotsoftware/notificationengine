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
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // use SSL
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWD
        }
    },
    retryCounter:{
        email: {
            p1: 4,
            p2: 2
        },
        sms: {
            p1: 4,
            p2: 2
        }
    },
    sms:{
        api_url: process.env.SMS_CONN_STRING,
        api_secret: process.env.SMS_SECRET,
        api_key: process.env.SMS_KEY
    },
    delimiters:["{{", "}}"]
};