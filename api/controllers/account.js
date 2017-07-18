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
var DomainChecked = require("../models/data_define").DomainChecked;
var Jimp = require('jimp');
var Path = require('path');

module.exports = {
    createAccount: createAccount,
    getAccount,
    createSubscribe,
    getSubscribeInfo,
    sendPhoneCode,
    preparePhoneCode,
    refreshVerifyCode,
    refreshVerifyCodeImage,
    resetPassword,
    getChecked
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
        var sending = '';
        if(sendingData.application=='resetPassword'){
            sending = '您的重置验证码是'+result.phoneCode+"。退订回 T 。";
        }else{
            sending = '您的注册验证码是'+result.phoneCode+"。退订回 T 。"
        }
        SMSUtil.send(result.phone,sending);
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
    let query = req.query || {};
    query.limit = query.limit || 50;
    query.offset = (query.start || 0) * query.limit;
    DomainSubscribe.getSubscribeInfo(authUser, query).then((arrayJson)=>{
        res.status(200);
        let result = {
            arrayData: arrayJson,
            start : query.start,
            limit : query.limit
        };
        res.json(result);
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

var base = "0,1,2,3,4,5,6,7,8,9,a,b,c,d,e,f,g,h,j,k,l,m,n,p,q,r,s,t,u,v,w,x,y".split(',');
var baseLength = base.length;
function randomChar(){
    let rcIndex = Math.floor(Math.random()*baseLength);
    return base[rcIndex];
};
let arrayBase = new Array(6).fill(1);
let pngBase = {};

function refreshVerifyCode(req, res){
    let info = req.body;
    let infoIsValid = !!info && info.id && info.uuid;
    if(infoIsValid){
        let charArray = arrayBase.map((ele) => randomChar());
        let fileArray = charArray.map((ele) => `base/r${ele}.png`);
        let date = new Date();
        let targetPath = Path.resolve(`${__dirname}/../../verifycode/verify_${info.id}_${date.getTime()}.png`);
        info.verifyCode = charArray.join('');
        DomainPhoneCode.refreshVerifyCode(info).then(()=>{
            return Jimp.read('test.png').then((testpng)=>{
                return Promise.all([testpng, pngBase[charArray[0]]|| Jimp.read(fileArray[0]), pngBase[charArray[1]] ||Jimp.read(fileArray[1]),pngBase[charArray[2]] ||Jimp.read(fileArray[2]),pngBase[charArray[3]] ||Jimp.read(fileArray[3]),pngBase[charArray[4]] ||Jimp.read(fileArray[4]),pngBase[charArray[5]] ||Jimp.read(fileArray[5])]);
            });
        }).then((values)=>{
            let base = values[0];
            for(let idx = 0; idx < 6; ++idx){
                pngBase[charArray[idx]] = pngBase[fileArray[idx]] || values[idx+1];
                base.composite(values[idx+1].clone().rotate(Math.random()*90 - 45),(9 + 22 * idx), 10);
            };
            base.write(targetPath);
            return base;
        }).then((returnImage)=>{
            res.status(200);
            res.json({id:info.id, timestamp:date.getTime()});
        }).catch((err)=>{
            res.status(500);
            res.json(err);
        });
    }else {
        res.status(500);
        res.json({
            code: 1501,
            message: "信息不正确: id, uuid"
        });
    }
};

function refreshVerifyCodeImage(req, res){
    var codeId = req.params.id;
    var codeTimestamp = req.params.timestamp;
    let targetPath = Path.resolve(`${__dirname}/../../verifycode/verify_${codeId}_${codeTimestamp}.png`);
    res.sendFile(targetPath);
};

function resetPassword(req, res){
    let resetData = req.body;
    let infoIsValid = !!resetData && resetData.account && resetData.password && resetData.confirm && resetData.phoneCode && resetData.verifyCode;
    infoIsValid = infoIsValid && (resetData.password == resetData.confirm);
    if(infoIsValid){
        DomainAccount.resetPassword(resetData).then(()=>{
            res.status(200);
            res.json({
                code:0,
                message:"成功"
            });
        });
    }else{
        res.status(500);
        res.json({
            code:12
        })
    }
}

function getChecked(req, res){
    let authUser = req.user;
    DomainChecked.findAll({
        where:{
            account:authUser.id
        }
    }).then((findArray)=>{
        console.log(findArray);
        if(findArray){
            res.json({
                checkedArray:findArray.map((ele)=>{
                    return ele.toJSON()
                })
            });
        }
        res.status(200);
    })
}

