# Notification Engine

## Introduction
Notification Engine is a service which will send notification to its subscribers. It will store templates and subscriptions, and only requires event to be triggered when notification needs to be sent. It will support priority of 2 level. A priority 1 notification will be retried in case of failure but priority 2 notification will always be tried only once.

## Required Software
	1. RabbitMQ
	2. MongoDB
	3. Redis
	4. npm
	
## How to start Notification Engine
1. git clone from https://github.com/capiotsoftware/notificationengine.git
2. do `npm install`
3. Update config file in config folder
4. Start MongoDB, Redis, user management service
5. run the service using `node app.js`

## Environment variables

* __PORT__: The port at which Notification Engine should start. The default value is _10010_
* __MONGO\_URL__: The mongoDB connection string. The default value is _mongodb://localhost/notificationEngine_
* __RABBIT\_URL__: The RabbitMQ connection string. The default value is _amqp://localhost_
* __SMTP\_EMAIL__ && __SMTP\_PASSWD__: The email id and password to be used to send out email notification.
* __SMS\_CONN\_STRING__, __SMS\_SECRET__, __SMS\_KE__: SMS connection details.
* __SERVICES__: If this is set, then all the support services are started when the notification engine starts.
* __DEBUG__: If set then the service would start outputiing _debug_ level logs. This is helpful to troubleshoot issue.


## Parts
1. **User Authorization** : For each API, http request should contain a JWT in header under authorization.  
2. **Template CRUD** : These are the message templates. It may contain placeholder inside `{{}}`. Value of placeholders can be provided while triggering notify event or can be fetched from usermanagement.
3. **Event CRUD** : Event will carry information like sender emailID, sender Mobile No, list of templates needs to be sent, default recipient list and priority.
4. **Subscription CRUD** : This will contain a recipient list corresponding to an event. Recipient list will contain userID  or GroupID of users/groups in usermanagement service.
5. **Notify API** : The API which will trigger the notification process.
6. **SMS gateway**: API to send SMS.
7. **Email System**: In-built email system to send emails.
8. **RabbitMQ**: Queue to manage Email and SMS notifications.
	
## Template
#### Create API
    properties:
      subject (In case of Email):
        type: string
      body (HTML supported in case of Email):
        type: string
      type (email or SMS):
        type: string
        enum: ["sms", "email"]
      isGroupMailer (Email to be sent in a group or separately):
        type: boolean
	required: 
      - body
      - type

## Event
#### Create API
    properties:
      templateIDs (List of templates needs to be sent):
        type: array
        items:
          type: string
      SMS (name and number of the sender):
        properties:
          name:
            type: string
          number:
            type: string
      email (name and email address of sender):
        properties:
          name:
            type: string
          address:
            type: string
      defaultRecipientList (These users will always receive notification when notify with this event is triggered):
        type: array
        items:
          required:
            - type
            - destination
          properties:
            destination:
              type: string
            name:
              type: string
            type:
              type: string
              enum: ['sms', 'email']
      description:
        type: string
      priority:
        type: number
        enum: [1, 2]
	required:
      - templateIDs
      - description
      - priority
## Subscription
#### Create API
    properties:
      recipients:
        type: array
        items:
          properties:
            id:
              type: string
            type:
              type: string
              enum: ["user", "group"]
      eventID:
        type: string
	required:
      - recipients
      - eventID

## Notify API	  
    properties:
      subscriptionID:
        type: string
      earlyEnrichments (Object with key as placeholder and value as placeholder value):
        type: object
      attachmentURLs (Attachment URL which needs to be sent along with Email):
        type: array
        items:
          type: string
	required:
      - subscriptionID

## Integrations
1. **User Management**: This will be customer side service. It is expected to expose API for user permission check and get user details for notification process. URL can be configured in config file.
2. **SMS gateway**: API to send SMS. SMS gateway configuration can be configured in config file.
3. **Email**: Email notification is in-built process. However, SMTP configuration of sender needs to be configured in SMTPConfig.json file. A default SMTP config also needs to be configured in config file.
4. **MongoDB**: MongoDB as database.
5. **Redis Server**.
6. **RabbitMQ**: Message broker to manage Email and SMS notification. Setup configurations in config file.