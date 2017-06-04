"use strict";

var util = require("util");
var DomainAccount = require("../models/data_define").DomainAccount;
var DomainCouponStrategyAccess = require("../models/data_define").DomainCouponStrategyAccess;
var DomainCouponStrategy = require("../models/data_define").DomainCouponStrategy;
var DomainCouponTemplate = require("../models/data_define").DomainCouponTemplate;
var DomainShop = require("../models/data_define").DomainShop;
var DomainCouponInstance = require("../models/data_define").DomainCouponInstance;
var DomainArea = require("../models/data_define").DomainArea;

module.exports = {
    queryAreaList,
    queryStrategyList,
    addNewStrategy,
    addNewStrategyAccess,
    queryMyShopList,
    queryShopStrategyList,
    generateTemplateByStrategy,
    queryShopTemplateList,
    publishShopTemplate,
    queryUserCoupon,
    randomAreaCoupon,
    receiveCoupon,
    addNewArea,
    queryShopOfTheArea,
    addNewShopOfTheArea,
    queryMyShopWorkList
};
/**
 * 获取区域列表
 * 以后会接收参数 区域名称%，区域索引%, page, step
 */
function queryAreaList(req, res){
    DomainArea.queryAreaList().then( arrayJson =>{
        res.json(arrayJson);
    }).catch( (error)=>{
        res.status(500);
        res.json({
            code: 1300,
            message: "系统错误"
        });
    });
};

function addNewArea(req, res){
    let areaInfo = req.body;
    DomainArea.addNewArea(areaInfo).then( (arrayJson, created)=>{
        res.json(arrayJson[0].toJSON());
    }).catch( (error)=>{
        res.status(500);
        res.json({
            code: 1300,
            message: "系统错误"
        });
    });
};

/**
 * 获得用户店面下的策略列表
 */
function queryStrategyList(req, res){
    DomainCouponStrategy.queryStrategyList().then((arrayJson)=>{
        res.json(arrayJson);
    }).catch((error)=>{
        res.status(500);
        res.json({
            code: 1500,
            message: "找不到授权模版"
        });
    });
};

function queryMyShopList(req, res){
    let authUser = req.user;
    DomainShop.queryMyShopList(authUser).then((arrayJson)=>{
        res.json(arrayJson);
    }).catch((error)=>{
        res.status(500);
        res.json({
            code: 1500,
            message: "找不到授权模版"
        });
    });
};
function queryMyShopWorkList(req, res){
    let authUser = req.user;
    DomainShop.queryMyShopWorkList(authUser).then((arrayResult)=>{
        console.log(arrayResult);
        res.json(arrayResult);
    }).catch((error)=>{
        res.status(500);
        res.json({
            code: 1500,
            message: "找不到授权模版"
        });
    });
};
function addNewStrategy(req, res){
    let strategy = req.body;
    DomainCouponStrategy.addNewStrategy(strategy).then((arrayInstance, created)=>{
        let arrayJson = arrayInstance[0].toJSON();
        res.json(arrayJson);
    }).catch((error)=>{
        res.status(500);
        res.json({
            code: 1500,
            message: "找不到授权模版"
        });
    });
};
function addNewStrategyAccess(req, res){
    let access = req.body;
    DomainCouponStrategyAccess.addNewStrategyAccess(access).then((arrayInstance,created)=>{
        let createdAccess = arrayInstance[0].toJSON();
        res.json(createdAccess);
    }).catch((error)=>{
        res.status(500);
        res.json({
            code: 1500,
            message: "找不到授权模版"
        });
    });
}
/**
 * 获得店面下的策略列表
 */
function queryShopStrategyList(req, res){
    let shopId = req.params.shopId;
    DomainCouponStrategyAccess.queryStrategyAccessedOfTheShop(shopId)
        .then( (arrayJson)=>{
            res.status(200);
            res.json(arrayJson);
        })
        .catch( (error)=>{
            res.status(500);
            res.json({
                code: 1200,
                message: "找不到授权模版"
            });
        });
};

function generateTemplateByStrategy(req, res){
    let authUser = req.user;
    let accessStrategy = req.body;
    DomainCouponTemplate.generateTemplateByStrategy(authUser, accessStrategy) .then( (arrayJson, created) =>{
        res.status(200);
        res.json(arrayJson);
    }).catch( (error)=>{
        res.status(500);
        res.json({
            code: 1200,
            message: "找不到授权模版"
        });
    });
};

function queryShopTemplateList(req, res){
    let authUser = req.user;
    let shopId = req.params.shopId;
    DomainCouponTemplate.queryShopTemplateList(authUser, shopId).then((arrayJson) =>{
        res.json(arrayJson);
    }).catch( (error)=>{
        res.status(500);
        res.json({
            code: 1200,
            message: "找不到授权模版"
        });
    });
};

function publishShopTemplate(req, res){
    let authUser = req.user;
    let templateId = req.params.templateId;
    DomainCouponTemplate.publishShopTemplate(authUser, templateId).then( (counted) =>{
        let count = counted[0];
        res.json(count);
    }).catch( (error)=>{
        res.status(500);
        res.json({
            code: 1200,
            message: "找不到授权模版"
        });
    });
};

function queryUserCoupon(req, res){
    let authUser = req.user;
    DomainCouponInstance.queryUserCoupon(authUser).then( (arrayJson) =>{
        res.json(arrayJson);
    }).catch( (error)=>{
        res.status(500);
        res.json({
            code: 1300,
            message: "系统错误"
        });
    });
};

function randomAreaCoupon(req, res){
    let authUser = req.user;
    let areaIndex = req.params.areaIndex;
    DomainArea.randomAreaCoupon(authUser, areaIndex).then( arrayJson =>{
        res.json(arrayJson);
    }).catch( (error)=>{
        res.status(500);
        res.json({
            code: 1300,
            message: "系统错误"
        });
    });
};

function receiveCoupon(req, res){
    let authUser = req.user;
    let couponTemplate = req.body;
    DomainCouponInstance.generateCouponFromTemplate(authUser, couponTemplate).then((arrayJson, created)=>{
        res.json(arrayJson[0].toJSON());
    }).catch( (error)=>{
        res.status(500);
        res.json({
            code: 1300,
            message: "系统错误"
        });
    });
};

function queryShopOfTheArea(req, res){
    let areaIndex = req.params.areaIndex;
    DomainShop.queryShopOfTheArea(areaIndex).then((arrayJson)=>{
        res.json(arrayJson);
    }).catch( (error)=>{
        res.status(500);
        res.json({
            code: 1300,
            message: "系统错误"
        });
    });
};

function addNewShopOfTheArea(req, res){
    let newShop = req.body;
    DomainShop.addNewShopOfTheArea(newShop).then( (arrayInstance, created) =>{
        let arrayJson = arrayInstance[0].toJSON();
        res.status(200);
        res.json(arrayJson);
    }).catch( (error)=>{
        res.status(500);
        res.json({
            code: 1300,
            message: "系统错误"
        });
    });
}
