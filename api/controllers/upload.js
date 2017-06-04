"use strict";


var util = require("util");

module.exports = {
    receiveFile: receiveFile
};


function receiveFile(req, res, next){
    if (!req.file){
        res.status(400).send('No files were uploaded.');
    }else{
        console.log(req.file);
        res.status(200).send("ok");
    }
    next();
};
