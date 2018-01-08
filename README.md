# Notification Engine

## Introduction
Notification Engine is a service which will send notification to its subscribers. It will manages templates and subscriptions, and when an event is triggered the required set of notifications will to be the recipients. 

## Required Software
1. Node.js
2. RabbitMQ
3. MongoDB
	
## How to start Notification Engine
1. Clone this repository.
2. Do an `npm install`
3. Update config file in config folder with the correct set of values or provide them as environemnt variables to node.
4. Start MongoDB and RabbitMQ
5. Run the service using `node app.js`

## Environment variables

* __PORT__: The port at which Notification Engine should start. The default value is _10010_
* __MONGO\_URL__: The mongoDB connection string. The default value is _mongodb://localhost/notificationEngine_
* __RABBIT\_URL__: The RabbitMQ connection string. The default value is _amqp://localhost_
* __SMTP\_EMAIL__ && __SMTP\_PASSWD__: The email id and password to be used to send out email notification.
* __SMS\_CONN\_STRING__, __SMS\_SECRET__, __SMS\_KE__: SMS connection details.
* __SERVICES__: If this is set, then all the support services are started when the notification engine starts.
* __LOG\_LEVEL__: log4j log level. If not set default value will be info.

## Sample command to start Notification Engine

```sh
SMTP_EMAIL=johndoe@gmail.com SMTP_PASSWD=******* SMS_CONN_STRING=http://mysmsgateway.com/sendsms SMS_SECRET=thisisansmssecret SMS_KEY=thisisansmskey SERVICES=true nodemon app.js

```
## CLI arguments
Supports two optional arguments:
1. `-g` Generates UI components
2. `-h` Help text