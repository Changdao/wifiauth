"use strict";

var util = require("util");
var DomainCouponConsumption = require("../models/data_define").DomainCouponConsumption;
var DomainAccountRelation = require("../models/data_define").DomainAccountRelation;
var DomainAccount = require("../models/data_define").DomainAccount;
var DomainCouponInstance = require("../models/data_define").DomainCouponInstance;

module.exports = {
    queryMyClerkList,
    deleteMyClerk,
    addMyClerk,
    queryMyClerkListInTheShop,
    queryMyWriteOffInTheShop,
    writeOffCoupon
};


/**
 * 获取我手下的店员
 * req user
 * res account array
 */
function queryMyClerkList(req, res){
    let authUser = req.user;
    let result = {
        code: 1110,
        message: "没有找到用户"
    };
    if(authUser){
        DomainAccountRelation.queryMyClerkList(authUser)
            .then( (arrayInstance)=>{
                let clerkAccountList = arrayInstance.map((ele, idx, array)=>{
                    return ele.toJSON();
                });
                res.json(clerkAccountList);
            })
            .catch( (error)=>{
                res.status(500);
                res.json(error);
            });
    }else{
        res.status(500);
        res.json(result);
    }
};

function queryMyClerkListInTheShop(req, res){
    let authUser = req.user;
    let shopId = req.params.shopId;
    DomainAccountRelation.queryMyClerkListInTheShop(authUser, shopId).then((arrayJson)=>{
        res.json(arrayJson);
    }).catch((error)=>{
        res.status(500);
        res.json({
            code: 1112,
            message: "系统错误"
        });
    });
};

function deleteMyClerk(req, res){
    let authUser = req.user;
    let theClerkId = req.params.clerkId;
    if(authUser){
        DomainAccountRelation.disableMyClerk(authUser, theClerkId)
            .then( (deleted)=>{
                console.log(deleted);
                res.status(200);
                res.json({
                    code:0,
                    message:"成功移除店员"
                });
            })
            .catch((error)=>{
                res.status(500);
                res.json(error);
            });
    }
};

function addMyClerk(req, res){
    let authUser = req.user;
    let theClerk = req.body;
    if(authUser){
        DomainAccount.findReidsAccount({account: theClerk.account})
            .then( (user)=>{
                if(!user) {
                    throw {
                        code: 1110,
                        message: "没有此用户"
                    };
                }else{
                    DomainAccountRelation.addMyClerk(authUser, theClerk)
                        .then( (instance, created)=>{
                            let inst = instance[0];
                            if(!created){
                                inst.set("status", "enabled");
                                return inst.save();
                            }else{
                                return inst;
                            }
                        })
                        .then( (inst) =>{
                            res.status(200);
                            res.json({
                                code:0,
                                message:"添加成功",
                                clerkId: inst.getDataValue("id")
                            });
                        });
                };
            })
            .catch( (error) =>{
                res.status(500);
                res.json(error);
            });
    };
};

function queryMyWriteOffInTheShop(req, res){
    let authUser = req.user;
    let shopId = req.params.shopId;
    DomainCouponConsumption.queryMyWriteOffInTheShop(authUser, shopId).then( (arrayJson) =>{
        res.json(arrayJson);
    }).catch( (error) =>{
        res.status(500);
        res.json(error);
    });
};

function writeOffCoupon(req, res){
    let authUser = req.user;
    let coupon = req.body;
    DomainCouponConsumption.writeOffCoupon(authUser, coupon).then((arrayInstance)=>{
        if(arrayInstance[1]){
            DomainCouponInstance.consumeTheCouponInstance(coupon).then((result)=>{
                res.json({
                    code:0,
                    message:"核销成功",
                    consumption: arrayInstance[0].toJSON()
                });
            });
        }else{
            res.json({
                code:1600,
                message:"优惠券已经使用",
                consumption: arrayInstance[0].toJSON()
            });
        }
    }).catch( (error) =>{
        res.status(500);
        res.json(error);
    });
};

/**
 * liuhanru
 * 8759afa75681dc0a42909afff8d8a781ab22d8d2
 * /consumption/clerk
 * account:liuhanru10
 * accountName:liuhr
 * 
 */
