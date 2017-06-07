'use strict';
var express = require('express'),
    bodyParser = require('body-parser'),
    oauthserver = require('oauth2-server'); // Would be: 'oauth2-server'
var multer = require('multer');

var controllerAccount = require('./api/controllers/account');
var controllerUpload = require('./api/controllers/upload');

var app = express();
var upload = multer({dest:"uploads/"});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.oauth = oauthserver({
    model: require('./api/models/oauth2.model'),
    grants: ['password', 'refresh_token'],
    debug: true
});


// Handle token grant requests
app.all('/wifiauth/token', app.oauth.grant());
//上传文件
app.post('/wifiauth/upload', upload.single('file'), controllerUpload.receiveFile);
app.get('/wifiauth/uploads/:filename', controllerUpload.sendFile);
app.post('/wifiauth/phone/code/send', controllerAccount.sendPhoneCode);
app.post('/wifiauth/phone/code/prepare', controllerAccount.preparePhoneCode);

app.post('/wifiauth/signup', controllerAccount.createAccount);

app.post('/wifiauth/authed/subscribe', app.oauth.authorise(), controllerAccount.createSubscribe);
app.get('/wifiauth/authed/subscribe', app.oauth.authorise(), controllerAccount.getSubscribeInfo);
app.get('/wifiauth/authed/account', app.oauth.authorise(), controllerAccount.getAccount);

app.get('/wifiauth/testsms',controllerAccount.testSMS);

app.get('/oauth/authorise', app.oauth.authorise(), function (req, res) {
    // Will require a valid access_token
    res.send('Secret area');
});

app.get('/public', function (req, res) {
  // Does not require an access_token
  res.send('Public area');
});

app.use(app.oauth.errorHandler());

var port = process.env.PORT || 10010;
app.listen(port);

// for test
module.exports = app;

