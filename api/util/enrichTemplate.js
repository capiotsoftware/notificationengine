"use strict";
var tag = ["{{", "}}"];
var e = {};
e.render = (template, view) => {
    // console.log("Temp ", template);
    if (!template) {
        return "";
    }
    var tokenStartIndex = template.indexOf(tag[0]),
        tokenEndIndex = template.indexOf(tag[1]);
    var loopStartIndex = template.indexOf(tag[0] + "#"),
        loopEndIndex = template.indexOf(tag[0] + "/");
    if (loopStartIndex <= tokenStartIndex && loopEndIndex >= 0) {

        var token = template.substring(loopStartIndex + tag[0].length + 1, tokenEndIndex);
        // console.log("Token ", token)
        loopEndIndex = template.indexOf(tag[0] + '/' + token.trim() + tag[1]);
        var tokenVal = getTokenValue(token, view);
        // console.log("token Val", tokenVal);
        var loopTemp = template.substring(0, loopStartIndex);
        if (tokenVal instanceof Array) {
            var loopTemplate = template.substring(loopStartIndex + tag[0].length + 1 + token.length + tag[1].length, loopEndIndex);
            tokenVal.forEach(obj => {
                loopTemp += e.render(loopTemplate, obj)
            })
        }
        return loopTemp.concat(e.render(template.substring(loopEndIndex + tag[0].length + 1 + token.length + tag[1].length + 1), view));
    } else if (tokenStartIndex >= 0 && tokenEndIndex >= 0) {
        var token = template.substring(tokenStartIndex + tag[0].length, tokenEndIndex);
        var tokenVal = getTokenValue(token, view);
        return template.substring(0, tokenStartIndex).concat(tokenVal === null ? tag[0] + token + tag[1] : tokenVal).concat(e.render(template.substring(tokenEndIndex + tag[1].length), view));
    }
    return template;
}
var getTokenValue = (token, view) => {
    token = token.trim().split(" ")[0];
    // console.log("Trim token", token);
    var keyIndex = token.indexOf('.');
    if (token === ".") {
        return view;
    } else if (keyIndex < 0) {
        return view[token] ? typeof view[token] === 'function' ? view[token]() : view[token] : null;
    } else {
        return view[token.substring(0, keyIndex)] ? getTokenValue(token.substring(keyIndex + 1), view[token.substring(0, keyIndex)]) : null
    }
}

module.exports = e;
// var view = { greeting: function () { return "Namaste" }, user: { name: "Shobhit" }, test2: [{ test: [{ to: "a" }] }, { test: [{ to: "b" }, { to: "e" }] }] };
// var text = "{{greeting}}: {{ user.name }}, are u there {{#test2}}\n Hello{{#test}} <li>{{to}}</li> {{/test}}  {{/test2}}";
// console.log("output ", render(text, view));