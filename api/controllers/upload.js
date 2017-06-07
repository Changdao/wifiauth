"use strict";


var util = require("util");
var Path = require('path');
module.exports = {
    receiveFile: receiveFile,
    sendFile
};


function receiveFile(req, res, next){
    if (!req.file){
        console.log(req);
        res.status(400).send('No files were uploaded.');
    }else{
        console.log(req.file);
        let result = {};
        for( let key in req.file){
            result[key] = req.file[key];
        };
        result.fileurl = result.destination + result.filename;
        res.status(200).json(result);
    }
    next();
};

function sendFile(req, res, next){
    var fileName = req.params.filename;
    var filePath = Path.resolve(`${__dirname}/../../uploads/${fileName}`);
    console.log('==>path:',filePath);
    res.sendFile(filePath);
}
