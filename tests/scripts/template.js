var winston = require('winston');

function getDateTime() { var sd = new Date(); var syear = sd.getFullYear(); var smonth = ('0' + (sd.getMonth() + 1)).slice(-2); var sdate = ('0' + sd.getDate()).slice(-2); var shours = ('0' + sd.getHours()).slice(-2); var sminutes = ('0' + sd.getMinutes()).slice(-2); var sseconds = ('0' + sd.getSeconds()).slice(-2); var startDate = syear + '-' + smonth + '-' + sdate; var startTime = shours + '-' + sminutes + '-' + sseconds; return startDate + '_' + startTime; };
var logger = new(winston.Logger)({ transports: [new(winston.transports.File)({ filename: 'logs/Log_' + getDateTime() + '_template.json.log' })] });
var expect = require('chai').expect;
var assert = require('chai').assert;
var api1 = require('supertest')('http://localhost:10010/ne');
describe('Template tests', function() {
    var data = '';
    it('Template: Fetch all', function(done) {
        logger.info('Title: Template: Fetch all');
        api1.get("/template").expect(200).end(function(err, res) {
            logger.info('Request');
            logger.info('Request METHOD', res.request.method);
            logger.info('Request URL', res.request.url);
            logger.info('Request HEADER', res.request.header);
            logger.info('Request DATA', res.request._data);
            logger.info('Response STATUS', res.statusCode);
            logger.info('Response HEADER', res.headers);
            logger.info('Response BODY', res.body);
            try {
                expect(res.status).to.equal(200);
                expect(err).to.be.null;
                expect(res.body).to.be.not.null;
                expect(res.body).to.be.an('array');
                logger.info('Template: Fetch all :: PASS');
            } catch (_err) {
                logger.error(_err.message);
                logger.info('Template: Fetch all :: FAIL');
                assert.fail(_err.actual, _err.expected, _err.message);
            };
            done();
        });
    });
    it('Template: Create Email Template', function(done) {
        logger.info('Title: Template: Create Email Template');
        var request = api1.post('/template').send({ "subject": "Order \\{\\{orderId\\}\\} status", "body": "<p style=\"text-align: center;\"><img class=\"fr-fir fr-dii\" width=\"200\" src=\"https://cdn0.froala.com/assets/editor/pages/B/editor-photo-645d411798e5b4e825765d091dd5aaab.jpg\" alt=\"Editor photo\"></p><p>Hi <strong>{{username}}</strong>,</p><p>Your order with the order id <strong>{{orderId}}</strong>, has been <span style=\"color: rgb(44, 130, 201);\"><u>shipped</u></span> and is expected to reach you by <span style=\"color: rgb(40, 50, 78);\"><strong>{{date}}</strong></span></p><p><em>Regards,</em></p><p><em>Team Captain Logistics</em></p>", "type": "email", "isGroupMailer": false, "name": "Order Email template" }).expect(200).end(function(err, res) {
            logger.info('Request');
            logger.info('Request METHOD', res.request.method);
            logger.info('Request URL', res.request.url);
            logger.info('Request HEADER', res.request.header);
            logger.info('Request DATA', res.request._data);
            logger.info('Response STATUS', res.statusCode);
            logger.info('Response HEADER', res.headers);
            logger.info('Response BODY', res.body);
            try {
                expect(res.status).to.equal(200);
                expect(err).to.be.null;
                expect(res.body).to.be.not.null;
                expect(res.body.subject).to.be.equal(orderId);
                expect(res.body.body).to.be.equal(username);
                expect(res.body.type).to.be.a('string');
                expect(res.body.type).to.be.equal('email');
                expect(res.body.isGroupMailer).to.all.satisfy(bool => typeof bool === 'boolean');
                expect(res.body.isGroupMailer).to.be.equal(false);
                expect(res.body.name).to.be.a('string');
                expect(res.body.name).to.be.equal('Order Email template');
                expect(res.body._id).to.exist;
                logger.info('Template: Create Email Template :: PASS');
            } catch (_err) {
                logger.error(_err.message);
                logger.info('Template: Create Email Template :: FAIL');
                assert.fail(_err.actual, _err.expected, _err.message);
            };
            done();
        });
    });
});