"use strict";


var util = require("util");

module.exports = {
    receiveFile: receiveFile
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
