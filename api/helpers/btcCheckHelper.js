"use strict";

var timers = require("timers");
var https = require("https");
var DomainTxBtcInput = require("../models/data_define").DomainTxBtcInput;

var checkBtcInterval;

module.exports = {
    getBtcReceivedByAddress,
    startCheckBtc,
    stopCheckBtc
};

var txOffset = 0;

function getBtcReceivedByAddress(address, offset){
    let req = https.request({
        hostname:'blockchain.info',
        port: 443,
        path:`/rawaddr/${address}?offset=${offset}`,
        method: 'GET'
    }, (res)=>{
        let returnDataString = '';
        res.on('data',(d)=>{
            returnDataString += `${d}`;
        });
        res.on('end', () => {
            try{
                // console.log(`${returnDataString}`);
                let returnData = JSON.parse(returnDataString);
                let dataArray = returnData.txs;
                let prepareArray = [];
                dataArray.forEach((ele)=>{
                    Array.prototype.push.apply(prepareArray, ele.inputs.map((ie)=>{
                        return {
                            ver: ele.ver,
                            sequence : ie.sequence,
                            spent: ie.prev_out.spent,
                            preTxIndex: ie.prev_out.tx_index,
                            preType: ie.prev_out.type,
                            addr: ie.prev_out.addr,
                            value: ie.prev_out.value,
                            n: ie.prev_out.n,
                            preScript: ie.prev_out.script,
                            inputScript: ie.script,
                            blockHeight: ele.block_height,
                            relayed_by: ele.relayed_by,
                            block_time: ele.block_time,
                            result: ele.result,
                            txSize: ele.size,
                            txTime: ele.time,
                            txIndex: ele.tx_index,
                            vinSz: ele.vin_sz,
                            hash: ele.hash,
                            voutSz: ele.vout_sz,
                            txMethod: 1
                        };
                    }));
                    Array.prototype.push.apply(prepareArray, ele.out.map((oe)=>{
                        return {
                            ver: ele.ver,
                            sequence : oe.sequence,
                            spent: oe.spent,
                            preTxIndex: oe.tx_index,
                            preType: oe.type,
                            addr: oe.addr,
                            value: oe.value,
                            n: oe.n,
                            preScript: oe.script,
                            inputScript: undefined,
                            blockHeight: ele.block_height,
                            relayed_by: ele.relayed_by,
                            block_time: ele.block_time,
                            result: ele.result,
                            txSize: ele.size,
                            txTime: ele.time,
                            txIndex: ele.tx_index,
                            vinSz: ele.vin_sz,
                            hash: ele.hash,
                            voutSz: ele.vout_sz,
                            txMethod: 2
                        };
                    }));
                });
                DomainTxBtcInput.insertTxList(prepareArray).catch((e)=>{
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

function startCheckBtc(){
    if( typeof checkBtcInterval == 'undefined'){
        checkBtcInterval = timers.setInterval(()=>{
            console.log("checkBtc");
            getBtcReceivedByAddress('8040d94c2d4dde73e050f55429509c9ea2d03f6d',txOffset);
        }, 30 * 1000);
    }
    return checkBtcInterval;
};

function stopCheckBtc(){
    if( typeof checkBtcInterval != 'undefined'){
        timers.clearInterval(checkBtcInterval);
    }
};


