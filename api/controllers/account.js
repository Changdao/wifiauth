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
var DomainBank = require("../models/data_define").DomainBank;

module.exports = {
    createAccount: createAccount,
    getAccount,
    phoneCode,
    createSubscribe,
    getSubscribeInfo,
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
    let available = account && account.account && account.password;
    if(!available) {
        res.json(result);
        return;
    };
    delete(account.id);
    account.identifierType = account.identifierType || 'identifier';
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
 * 短信验证码
 */
function phoneCode(req, res){
    //console.log(req.body.phone);
    var phone = req.query.phone;
    var code = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    DomainPhoneCode.prepareAccountCode(phone, code)
        .then((codes)=>{
            res.status(200);
            res.json("ok");
            SMSUtil.send(phone,'您的验证码是'+code+"。");
        })
        .catch((error)=>{
            res.status(500);
            res.json(error);
        });
    //res.json({code:"633778", phone:req.body.phone});
}

/**
 * 获取订阅信息
 */
function getSubscribeInfo(req, res){
    let authUser = req.user;
    DomainSubscribe.getSubscribeInfo(authUser)
        .then((arrayJson)=>{
            res.status(200);
            res.json(arrayJson);
        });
};

function createSubscribe(req, res){
    let authUser = req.user;
    let info = req.body;
    let infoIsValid = !!info && info.subscribeAmount && (info.subscribeAmount > 0);
    infoIsValid = infoIsValid && info.bankType && info.bankAccount && info.bankUnit;
    if(infoIsValid){
        DomainBank.createBank(authUser, info)
            .then((bankInfo)=>{
                return DomainSubscribe.createSubscribe(authUser, info);
            })
            .then((subscribed)=>{
                res.status(200);
                res.json(subscribed);
            })
            .catch((errorInfo)=>{
                res.status(500);
                res.json(errorInfo);
            });
    }else{
        res.status(500);
        res.json({
            code: 1302,
            message: "信息不完整: subscribeAmount, bankType, bankAccount, bankUnit"
        });
    }
}
