"use strict";
/**
 用于处理优惠券模版
**/
var util = require("util");
var DomainCouponTemplate = require("../models/data_define").DomainCouponTemplate;

module.exports = {
    getAllCouponTemplate: getAllCouponTemplate,
    createCouponTemplate: createCouponTemplate
};

/**
 * req: handle the request object
 * res: handle the response object
**/
function getAllCouponTemplate(req, res){
    var status = req.swagger.params.status.value;
    var type = req.swagger.params.type.value;
    var origin = req.swagger.params.origin.value;
    DomainCouponTemplate
        .queryCouponTemplate(status, type, origin)
        .then((templateList)=>{
            console.log(`tmeplateList:${templateList}`);
            res.json({templateList});
        });
}

function createCouponTemplate(req, res){
    var newCouponTemplate = req.swagger.params.couponTemplate.value;
    DomainCouponTemplate
        .createCouponTemplate(newCouponTemplate)
        .then( (couponTemplate, created) =>{
            if(created){
                res.json(couponTemplate);
            }else{
                res.status(255).json({
                    code:10010001,
                    message:"has the template"
                });
            }
        });
}
