var definition = {
    "_id": {
        "type": "String",
        "default": null
    },
    "recipients": [
        {
            "id": {
                "type": "String"
            },
            "type": {
                "type": "String",
                "enum": [
                    "user",
                    "group"
                ],
                "required": true
            }
        }
    ],
    "eventID": {
        "type": "String",
        "required": true
    }
};
module.exports.definition=definition;