const user = require("./user");
const product = require("./product");
var e = {};
e.init = () => {
    user.init();
    product.init();
};

module.exports = e;