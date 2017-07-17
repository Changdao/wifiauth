"use strict";

var timers = require("timers");
var https = require("https");
var DomainTxEthList = require("../models/data_define").DomainTxEthList;

var checkEthInterval;

module.exports = {
    getEthReceivedByAddress,
    startCheckEth,
    stopCheckEth
};

var txOffset = 0;

function getEthReceivedByAddress(address, offset){
    let req = https.request({
        hostname:'etherchain.org',
        port: 443,
        path:`/api/account/${address}/tx/${offset}`,
        method: 'GET'
    }, (res)=>{
        let returnDataString = '';
        res.on('data',(d)=>{
            returnDataString += `${d}`;
        });
        res.on('end', () => {
            try{
                //console.log(`${returnDataString}`);
                let returnData = JSON.parse(returnDataString);
                let dataArray = returnData.data;
                DomainTxEthList.insertTxList(dataArray).catch((e)=>{
                    if(e.code != 1101){
                        throw e;
                    }
                });
                if(dataArray.length < 50){
                    txOffset = 0;
                }else{
                    txOffset += 50;
                }
            } catch (e){
                console.log(`${new Date()} : ${e}`);
                txOffset = 0;
            }
        });
    });
    req.on('error', (e)=>{
        console.log(e);
    });
    req.end();
};

function startCheckEth(){
    if( typeof checkEthInterval == 'undefined'){
        checkEthInterval = timers.setInterval(()=>{
            console.log("checkEth");
            getEthReceivedByAddress('0xECC472Db4A32Fd84F3BbAa261bF4598B66fC6cf2',txOffset);
        }, 30 * 1000);
    }
    return checkEthInterval;
};

function stopCheckEth(){
    if( typeof checkEthInterval != 'undefined'){
        timers.clearInterval(checkEthInterval);
    }
};


