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
    testSMS:function(){
        SMSUtil.send('13718961866','测试第一次1');
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
    console.log(account);
    let available = account && account.account && account.password;
    if(!available) {
        res.json(result);
        return;
    };
    delete(account.id);
    DomainAccount.findRedisAccount(account)
        .then((couldcreateUser)=>{
        })
        .catch((error)=>{
            res.json(error);
        });
    DomainAccount.createAccount(account)
        .then((result)=>{
            res.josn(result);
        })
        .catch((error)=>{
            res.json(error);
        });
    DomainAccount.findReidsAccount(account)
        .then((user)=>{
            //检查用户是否存在
            if(user){
                result = {
                    code: 1101,
                    message: "已经存在此用户"
                };
                res.json(result);
            }else{
                //检查短信验证吗
                
                DomainAccount.signUpAccount(account)
                    .then((xxx)=>{
                        result = {
                            code: 0,
                            message: "成功注册"
                        };
                        res.json(result);
                    },(err)=>{
                        res.json(err);
                    });
            }
        });
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
