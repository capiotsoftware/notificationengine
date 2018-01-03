"use strict";
const delimiters = require("../../config/config").delimiters;
var tag = delimiters;
var e = {};

e.render = (template, view) => {
    return new Promise(resolve => {
        if (!template) {
            resolve("");
        } else {
            var tokenStartIndex = template.indexOf(tag[0]),
                tokenEndIndex = template.indexOf(tag[1]);
            if (tokenStartIndex >= 0 && tokenEndIndex >= 0) {
                var token = template.substring(tokenStartIndex + tag[0].length, tokenEndIndex);
                var lastTemp = "";
                e.render(template.substring(tokenEndIndex + tag[1].length), view)
                    .then(temp => {
                        lastTemp = temp;
                    })
                    .then(() => {
                        return getTokenValue(token, view);
                    })
                    .then(tokenVal => {
                        template = template.substring(0, tokenStartIndex).concat(tokenVal === null ? tag[0] + token + tag[1] : tokenVal).concat(lastTemp);
                        resolve(template);
                    });
            } else {
                resolve(template);
            }
        }
    });
};

var getTokenValue = (token, view) => {
    return new Promise(resolve => {
        token = token.trim().split(" ")[0];
        var keyIndex = token.indexOf(".");
        if (token === ".") {
            resolve(view);
        } else if (keyIndex < 0) {
            var tokenVal = view[token] ? view[token] : null;
            resolve(tokenVal);
        } else {
            try {
                var servicePath = "../integrations/" + token.substring(0, keyIndex);
                if(!require.resolve(servicePath))
                    resolve(null);
                else{
                    const service = require(servicePath);
                    service.fetch(view, token.substring(keyIndex + 1))
                        .then(tokenVal => {
                            if (tokenVal)
                                resolve(tokenVal);
                            else {
                                resolve(null);
                            }
                        });
                }
            } catch (e) {
                resolve(null);
            }
        }
    });

};

module.exports = e;