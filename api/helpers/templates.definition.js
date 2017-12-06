var definition = {
    "_id": {
        "type": "String",
        "default": null
    },
    "subject": {
        "type": "String"
    },
    "body": {
        "type": "String",
        "required": true
    },
    "type": {
        "type": "String",
        "enum": [
            "sms",
            "email"
        ],
        "required": true
    },
    "isGroupMailer": {
        "type": "Boolean",
        "default": false
    }
};
module.exports.definition=definition;