const inquirer = require("inquirer");
const prompt = inquirer.createPromptModule();
const fs = require('fs');
var ncp = require('ncp').ncp;
ncp.limit = 32;
var questions = [];
questions.push({
    type: "list",
    name: "ui",
    message: "Select UI component you wish to generate.",
    default: "all",
    choices: ["all", "entities", "events", "subscriptions", "templates"]
});
questions.push({
    type: "input",
    name: "path",
    message: "Enter the path where you want to generate UI component",
    default: "../UIComponent"
});
var e = {};
e.generateUI = () => {
    prompt(questions)
        .then(result => {
            var dir = result['path'];
            if (!fs.existsSync(dir)) try {
                fs.mkdirSync(dir)
            } catch (e) {
                console.error(e);
            }
            if (result['ui'] == 'all') {
                ncp('./uiSamples/', dir, function(err) {
                    if (err) return console.error(err);
                    console.log('UI components created');
                    process.exit(0);
                });
            } else {
                dir += '/' + result['ui'];
                if (!fs.existsSync(dir)) fs.mkdirSync(dir);
                ncp('./uiSamples/' + result['ui'], dir, function(err) {
                    if (err) return console.error(err);
                    console.log('UI components created');
                    process.exit(0);
                });
            }

        })

}

e.help = () => {
    console.log("Notification Engine");
    console.log("Command: node app.js <options>");
    console.log("Run node app.js to start the Notification Engine.");
    console.log("Available options,");
    console.log("   -g    Generate the UI components.");
    console.log("   -h    Displays this help text.");
    process.exit(0);
}

module.exports = e;