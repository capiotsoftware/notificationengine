module.exports = {
    connectionStrings: {
        amqp: "amqp://localhost"
    },
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
            user: "notification.engine55@gmail.com",
            pass: "notifier"
        }
    },
    retryCounter:{
        email:1,
        sms:1
    },
    sms:{
        api_url:"http://localhost:10012/sendSMS",
        api_secret:"someSecretCannottell",
        api_key:"tShouldhavebeenUpperCaseInapi_secret"
    }
}