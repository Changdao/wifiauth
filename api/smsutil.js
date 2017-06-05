"use strict";

var request = require( "request" );
var crypto = require('crypto');

exports.send=function(phone,msg){
    var epid='153132';
    var ua ='uuwifi';
    var pwd='uuwifi';
    var base = 'http://211.140.167.3:9000/interface/smshttp.asp';


    var md5pwd = crypto.createHash("md5");
    md5pwd.update(pwd);
    var pwdstr = md5pwd.digest('hex');

    var md5sum=crypto.createHash( "md5" );
    md5sum.update( epid+ua+pwdstr+msg);
    var key = md5sum.digest( "hex" );

    var url = base+'?'+'epid='+epid+'&'+'ua='+ua+'&'+'key='+key+'&'+'msg='+msg+'&phone='+phone+'&linkid=';
    console.log('==>sms url:',url);
    request.get(url).on('data',function(data){
	    console.log(data.toString());
    })

};

