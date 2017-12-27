"use strict";

const mongoose = require("mongoose");
const definition = require("../helpers/entity.definition.js").definition;
const SMCrud = require("swagger-mongoose-crud");
const cuti = require("cuti");
const schema = new mongoose.Schema(definition);
const logger = global.logger;

var options = {
    logger: logger,
    collectionName: "entity"
};
cuti.counter.setDefaults("entity", 1000);

var crudder = new SMCrud(schema, "entity", options);
module.exports = {
    indexEntity: crudder.index,
    showEntity: crudder.show,
    updateEntity: crudder.update,
    countEntity: crudder.count
};