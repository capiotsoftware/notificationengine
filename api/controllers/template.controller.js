"use strict";

const mongoose = require("mongoose");
const definition = require("../helpers/templates.definition.js").definition;
const SMCrud = require("swagger-mongoose-crud");
const cuti = require("cuti");
const schema = new mongoose.Schema(definition);
const logger = global.logger;
const _ = require("lodash");

var options = {
    logger: logger,
    collectionName: "template"
};
cuti.counter.setDefaults("template", 1000);
schema.pre("validate", function (next) {
    this.type = this.type.toLowerCase();
    this.body = _.trim(this.body);
    this.type === "email" ? _.trim(this.subject) ? null : next(new Error("Subject is empty")) : null;
    this.name = _.trim(this.name);
    _.isEmpty(this.name) ? next(new Error("Name is empty")) : null;
    next();
});

schema.pre("save", cuti.counter.getIdGenerator("TMPL", "template"));

function documentDelete(req, res) {
    var id = req.swagger.params.id.value;
    mongoose.model("event").count({
        templateIDs: {
            $elemMatch: {
                $eq: id
            }
        }
    }, (_err, _docs) => {
        if (_err) res.status(500).json({
            "message": "Error querying DB!"
        });
        if (_docs != 0) res.status(400).json({
            "message": "Template " + id + " is still in use"
        });
        else crudder.destroy(req, res);
    });
}

var crudder = new SMCrud(schema, "template", options);
module.exports = {
    createTemplate: crudder.create,
    indexTemplate: crudder.index,
    showTemplate: crudder.show,
    destroyTemplate: documentDelete,
    updateTemplate: crudder.update,
    countTemplate: crudder.count
};