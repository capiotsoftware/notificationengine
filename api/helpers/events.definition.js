var definition = {
    "_id": {
        "type": "String",
        "default": null
    },
    "name":{
        "type": "String",
        "required": true,
        "unique": true
    },
    "templateIDs": [
        {
            "type": "String",
            "required": true
        }
    ],
    "sms": {
        "name": {
            "type": "String"
        },
        "number": {
            "type": "String"
        }
    },
    "email": {
        "name": {
            "type": "String"
        },
        "address": {
            "type": "String"
        }
    },
    "defaultRecipientList": [{
        "destination": {
            "type": "String",
            "required": true,
        },
        "name": {
            "type": "String"
        },
        "type": {
            "type": "String",
            "enum": [
                "sms",
                "email"
            ],
            "required": true
        }
    }],
    "description": {
        "type": "String",
        "required": true
    },
    "priority": {
        "type": "Number",
        "enum": [
            1,
            2
        ],
        "required": true
    }
};
module.exports.definition = definition;