"use strict";
if (!String.prototype.padStart) {
    String.prototype.padStart = function padStart(targetLength,padString) {
        targetLength = targetLength>>0; //floor if number or convert non-number to 0;
        padString = String(padString || ' ');
        if (this.length > targetLength) {
            return String(this);
        }
        else {
            targetLength = targetLength-this.length;
            if (targetLength > padString.length) {
                padString += padString.repeat(targetLength/padString.length); //append to original to ensure we are longer than needed
            }
            return padString.slice(0,targetLength) + String(this);
        }
    };
}
/**
 用于处理优惠券模版
**/
var util = require("util");
var SMSUtil = require('../smsutil');
var DomainAccount = require("../models/data_define").DomainAccount;
var DomainPhoneCode = require("../models/data_define").DomainPhoneCode;
var DomainSubscribe = require("../models/data_define").DomainSubscribe;

module.exports = {
    createAccount: createAccount,
    getAccount,
    createSubscribe,
    getSubscribeInfo,
    sendPhoneCode,
    preparePhoneCode,
    testSMS:function(req,res){
        SMSUtil.send('13718961866',req.query.msg);
        res.send('sent');
    }

};

/**
 * req request
 * res response
 */
function createAccount(req, res){
    let account = req.body;
    let result = {
        code: 1100,
        message: "没有提供有效参数"
    };
    let available = account && account.account && account.password && account.agreeliscense && account.isIntegrity;
    available = available && account.account.trim();
    if(!available) {
        res.json(result);
        return;
    };
    delete(account.id);
    account.identifierType = account.identifierType || 'identifier';
    account.account = account.account.trim();
    DomainAccount.signUpAccount(account)
        .then((result)=>{
            res.status(200);
            res.json(result);
        })
        .catch((errorResult)=>{
            res.status(500);
            res.json(errorResult);
        })
    ;
}
/**
 * get account info by token
 */
function getAccount(req, res){
    let authUser = req.user;
    DomainAccount
        .getAccountInfo(authUser)
        .then( (domainAccount)=>{
            res.status(200);
            res.json(domainAccount.toJSON());
        })
        .catch( (error) =>{
            res.json(error);
        });
}


/**
 * 准备短信验证码
 */
function preparePhoneCode(req, res){
    var prepare = req.body;
    prepare.code = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    DomainPhoneCode.preparePhoneCode(prepare).then((result)=>{
        res.status(200);
        result.phoneCode = undefined;
        res.json(result);
    }).catch((error)=>{
        res.status(500);
        res.json(error);
    });
};
/**
 * 发送短信验证吗
 */
function sendPhoneCode(req, res){
    var sendingData = req.body;
    DomainPhoneCode.sendPhoneCode(sendingData).then((result)=>{
        SMSUtil.send(result.phone,'您的注册验证码是'+result.phoneCode+"。退订回 T 。");
        res.status(200);
        res.json("ok");
    }).catch((error)=>{
        res.status(500);
        res.json(error);
    });
};

/**
 * 获取订阅信息
 */
function getSubscribeInfo(req, res){
    let authUser = req.user;
    console.log("user:"+JSON.stringify(authUser));
    DomainSubscribe.getSubscribeInfo(authUser).then((arrayJson)=>{
        res.status(200);
        res.json(arrayJson);
    }).catch((error)=>{
        res.status(500);
        res.json(error);
    });
};

function createSubscribe(req, res){
    let authUser = req.user;
    let info = req.body;
    let infoIsValid = !!info && info.subscribeAmount && (info.subscribeAmount > 0);
    infoIsValid = infoIsValid && info.bankType && info.bankAccount && info.bankUnit;
    if(infoIsValid){
        DomainSubscribe.createSubscribe(authUser, info)
            .then((subscribed)=>{
                res.status(200);
                res.json(subscribed);
            })
            .catch((errorInfo)=>{
                res.status(500);
                console.log("unknown");
                console.log(errorInfo);
                res.json(errorInfo);
            });
    }else{
        res.status(500);
        res.json({
            code: 1302,
            message: "信息不正确: subscribeAmount, bankType, bankAccount, bankUnit"
        });
    }
}
