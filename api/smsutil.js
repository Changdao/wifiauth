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
    var pwdstr = md5pwd.digest('hex').substring(8,24);
    console.log('==>pwdstr',pwdstr);
    var md5msg = crypto.createHash('md5');
    md5msg.update(msg);
    var msgmd5 = md5msg.digest('hex').substring(8,24);

    console.log('===msgmd5:',msgmd5);

    var d = epid+ua+pwdstr+msgmd5;
    console.log('===>data:',d);

    var md5sum=crypto.createHash( "md5" );
    md5sum.update(d);
    var key = md5sum.digest( "hex" ).substring(8,24);
    console.log('===>key:',key);

    var url = base+'?'+'epid='+epid+'&'+'ua='+ua+'&'+'key='+key+'&'+'msg='+msg+'&phone='+phone+'&linkid='+Math.trunc(Math.random()*1000);
    console.log('==>sms url:',url);
    request.get(url).on('data',function(data){
	    console.log(data.toString());
    })

};

exports.genKey = function(epid,ua,pwd,msg)
{
    var md5pwd = crypto.createHash("md5");
    md5pwd.update(pwd);
    var pwdstr = md5pwd.digest('hex');
    console.log(pwdstr);
    var md5sum=crypto.createHash( "md5" );
    md5sum.update( epid+ua+pwdstr+msg);
    var key = md5sum.digest( "hex" );
    console.log(key);
};

