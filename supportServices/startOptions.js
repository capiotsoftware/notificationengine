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
                ncp('./uiSamples/', dir, function (err) {
                    if (err) return console.error(err);
                    console.log('UI components created');
                    process.exit(0);
                });
            } else {
                dir += '/' + result['ui'];
                if (!fs.existsSync(dir)) fs.mkdirSync(dir);
                ncp('./uiSamples/' + result['ui'], dir, function (err) {
                    if (err) return console.error(err);
                    console.log('UI components created');
                    process.exit(0);
                });
            }
            
        })
    
}

e.help = () => {
    console.log(`Notification Engine is a service which will send notification to its subscribers. It will manages templates and subscriptions, and when an event is triggered the required set of notifications will to be the recipients.`);
    console.log(`\nargs supported:\n1. -g: Generates UI components\n2. -h: help`);
    process.exit(0);
}

module.exports = e;