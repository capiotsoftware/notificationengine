"use strict";
var tag = ["{{", "}}"];
var e = {};

e.render = (template, view) => {
    // console.log("Temp ", template);
    return new Promise((resolve, reject) => {
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
                        return getTokenValue(token, view)
                    })
                    .then(tokenVal => {
                        template = template.substring(0, tokenStartIndex).concat(tokenVal === null ? tag[0] + token + tag[1] : tokenVal).concat(lastTemp);
                        resolve(template);
                    })
            } else {
                resolve(template);
            }
        }
    })
};

var getTokenValue = (token, view) => {
    return new Promise((resolve, reject) => {
        token = token.trim().split(" ")[0];
        var keyIndex = token.indexOf('.');
        if (token === ".") {
            resolve(view);
        } else if (keyIndex < 0) {
            var tokenVal = view[token] ? typeof view[token] === 'function' ? view[token]() : view[token] : null;
            resolve(tokenVal);
        } else {
            try {
                // console.log("Hitting integration");
                const service = require('../integrations/' + token.substring(0, keyIndex));
                // console.log("view is", view);
                service.fetch(view, token.substring(keyIndex + 1))
                    .then(tokenVal => {
                        if (tokenVal)
                            resolve(tokenVal);
                        else {
                            resolve(null);
                        }
                    })
            } catch (e) {
                console.log("could not fetch from integration");
                resolve(null);
            }
        }
    })

}


var view = {
    greeting: function () {
        return "Namaste"
    },
    name: "Jim",
    verb: "there"
};

module.exports = e;

var text = "{{greeting}}: {{ name }}, are u {{verb}}?";
// e.render(text, view).then(out => {
//     console.log("output ", out);
// })