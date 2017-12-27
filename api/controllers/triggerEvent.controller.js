"use strict";
const channel = require("../channels/channel");
const logger = global.logger;

function triggerEvent(req, res){
    channel.processMessage(req.body)
        .then(() => res.send("Event is queued"))
        .catch(_err => {
            logger.error("_err", _err);
            res.status(500).send(_err.message);
        });     
}
module.exports = {
    processEvent:triggerEvent
};
    