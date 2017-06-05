"use strict";
/**
 用于处理优惠券模版
**/
var util = require("util");
var SMSUtil = require('../smsutil');
var DomainAccount = require("../models/data_define").DomainAccount;

module.exports = {
    createAccount: createAccount,
    getAccount,
    phoneCode,
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
    let result = {
        code: 1110,
        message: "没有找到用户"
    };
    
    if(authUser){
        DomainAccount
            .getAccountInfo(authUser)
            .then( (domainAccount)=>{
                res.status(200);
                res.json(domainAccount.toJSON());
            })
            .catch( (error) =>{
                res.json(error);
            });
    }else{
        res.status(500);
        res.json(result);
    }
}
/**
 * 短信验证码
 */
function phoneCode(req, res){
    //console.log(req.body.phone);
    var phone = req.query.phone;
    SMSUtil.send(phone,'您的验证码是9527');
    //这里调用短信网关发送短信
    res.status(200);
    res.json("ok");
    //res.json({code:"633778", phone:req.body.phone});
}
