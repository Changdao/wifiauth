"use strict";
/**
 用于处理优惠券
**/
var util = require("util");
var DomainCouponInstance = require("../models/data_define").DomainCouponInstance;
var DomainCouponConsumption = require("../models/data_define").DomainCouponConsumption;

module.exports = {
    createCouponInstance: createCouponInstance,
    getCouponOfUser: getCouponOfUser,
    receiveTheCoupon: receiveTheCoupon,
    writeOffTheCouponInstance: writeOffTheCouponInstance,
    getTheCouponListOfTheClerk: getTheCouponListOfTheClerk
};

/**
 * req: handle the request object
 * res: handle the response object
**/

function createCouponInstance(req, res){
    var couponTemplateInstance = req.swagger.params.couponTemplateInstance.value;
    couponTemplateInstance && DomainCouponInstance
        .createCouponInstanceFromTemplate(couponTemplateInstance)
        .then( (arrayInstance) =>{
            if(couponTemplateInstance.data.count == arrayInstance.length){
                console.log("insert ok");
            };
            console.log(`insert:${arrayInstance.length},count:${couponTemplateInstance.data.count}`);
            res.status(200);
            res.json({
                code:0,
                message:"generate ok"
            });
        });
}

function getCouponOfUser(req, res){
    var appUserId = req.swagger.params.appUserId.value;
    appUserId && DomainCouponInstance
        .queryNineCouponInstanceForUser(appUserId)
        .then( (arrayInstance) =>{
            console.log(`get:${arrayInstance.length}`);
            res.status(200);
            let resultArray = arrayInstance.map((ele, idx, array) => {
                return {
                    id: parseInt(ele.id),
                    name: ele.name,
                    data: ele.data,
                    status: ele.status
                };
            });
            let resultString = JSON.stringify( resultArray );
            console.log(resultString);
            res.json(resultArray);
        });
}

function receiveTheCoupon(req, res){
    var appUserId = req.swagger.params.appUserId.value;
    var couponInstance = req.swagger.params.couponInstance.value;
    console.log(JSON.stringify(couponInstance));
    DomainCouponInstance
        .takeOffTheCouponInstance(appUserId, couponInstance)
        .then( (arrayInstance) =>{
            res.status(200);
            res.json({
                code:0,
                message:"the coupon is takeoff"
            });
        });
}

function writeOffTheCouponInstance(req, res){
    var couponInstanceId = req.swagger.params.couponInstanceId.value;
    var couponDetail = req.swagger.params.couponDetail.value;
    DomainCouponConsumption
        .writeOffTheCouponInstance(couponInstanceId, couponDetail)
        .then( (instance, created)=>{
            res.status(200);
            couponDetail.id = parseInt(instance[0].id);
            console.log(`instance: ${JSON.stringify(instance[0])}`);
            console.log(`instanceId:${couponInstanceId},couponDetail:${JSON.stringify(couponDetail)}`);
            res.json(couponDetail);
        });
}

function getTheCouponListOfTheClerk(req, res){
    var clerkUserId = req.swagger.params.clerkUserId.value;
    DomainCouponConsumption
        .queryCoupontWritenOffByTheUser(clerkUserId)
        .then( (arrayInstance) =>{
            res.status(200);
            console.log( JSON.stringify(arrayInstance));
            res.json(arrayInstance);
        });
    
}
