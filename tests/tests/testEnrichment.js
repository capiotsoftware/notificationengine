const enrich = require("../../api/util/enrichTemplate");
const text  = "{{greeting}} {{name}}. This will be first test {{test}}<br> Your Team is: <ul> {{#members}} <li> {{.}} </li> {{/members}} </ul>";
const view = {greeting: "Hello", test: "qwertyu", members:["a","b","c"]};
console.log(enrich.render(text, view));