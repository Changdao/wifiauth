var Sequelize = require('../../config/database/sequelize').Sequelize;
var sequelize = require('../../config/database/sequelize').sequelize;
var bluebird = require('bluebird');
var redisdb = require('redis');
var redis = redisdb.createClient();
bluebird.promisifyAll(redisdb.RedisClient.prototype);
bluebird.promisifyAll(redisdb.Multi.prototype);

var formats = {
    user: 'users:',
    token: "tokens:"
};
var redisKey = function redisKey(key, keyValue){
    return `${key}${keyValue}`;
};

var DomainAccount = sequelize.define('t_account', {
    account:{
        type:Sequelize.STRING
    },
    accountName:{
        type:Sequelize.STRING,
        field:"account_name"
    },
    phone:{
        type:Sequelize.STRING
    },
    gender:{
        type:Sequelize.INTEGER
    },
    avatar:{
        type:Sequelize.STRING
    },
    password:{
        type:Sequelize.STRING
    },
    createAt:{
        type:Sequelize.DATE,
        field:"created_at"
    },
    status:{
        type:Sequelize.STRING
    },
    promoter:{
        type:Sequelize.INTEGER
    },
    accountType:{
        type:Sequelize.INTEGER,
        field:"account_type"
    }
});
DomainAccount.signUpAccount = function signUpAccount(newAccount){
    return DomainAccount.findRedisAccount(newAccount)
        .then((user)=>{
            return DomainPhoneCode.checkAccountCode(newAccount);
        })
        .then((phoneCodeInstance)=>{
            return DomainAccount.createAccount(newAccount);
        })
        .then((accountInstance)=>{
            return DomainIdentify.addAccountIdentify(newAccount);
        })
        .then((indentifierInstance)=>{
            return {
                code: 0,
                message: "ok"
            };
        });
};
DomainAccount.findRedisAccount = function findReidsAccount(newAccount){
    let userKey = redisKey(formats.user, newAccount.account);
    let hasTheUser = redis.hgetallAsync(userKey);
    return hasTheUser.then((user)=>{
        if(user){
            throw {
                code: 1101,
                message: "已经存在此用户"
            };
        }else{
            return user;
        }
    });
};
DomainAccount.createAccount = function signUpAccount(newAccount){
    let userKey = redisKey(formats.user, newAccount.account);
    let getUser = redis.hgetallAsync(userKey);
    let accountInfo = {
        username: newAccount.account,
        password: newAccount.password
    };
    return redis.hmsetAsync(userKey, accountInfo)
        .then(()=>{
            return this.findOrCreate({
                where:{
                    account:newAccount.account
                },
                defaults: {
                    account: newAccount.account,
                    password: newAccount.password,
                    accountName: newAccount.accountName || newAccount.account,
                    status: newAccount.status || 'enabled',
                    accountType: newAccount.accountType || 0,
                    promoter: newAccount.promoter,
                    gender: newAccount.gender,
                    avatar: newAccount.avatar,
                    phone: newAccount.phone
                }
            });
        });
    
};
DomainAccount.getAccountInfo = function getAccountInfo(authUser){
    return this.findOne({
        where:{
            account:authUser.id
        }
    });
};
DomainAccount.testPhoneExist = function testPhoneExist(phone){
    return this.findOne({
        where:{
            phone:phone
        }
    });
};
DomainAccount.deleteAccountFromRedis = function deleteAccountFromRedis(account){
    let userKey = redisKey(formats.user, account);
    return redis.delAsync(userKey)
        .then((deled)=>{
            return this.update({status:"disabled"},{
                where:{
                    account
                }
            });
        });
};
var DomainIdentify = sequelize.define("t_identify", {
    account: {
        type: Sequelize.STRING
    },
    identifierType:{
        type: Sequelize.STRING,
        field: "identifier_type"
    },
    identifierCode:{
        type: Sequelize.STRING,
        field: "identifier_code"
    },
    identifierType:{
        type: Sequelize.STRING,
        field: "identifier_type"
    },
    frontImgFile:{
        type: Sequelize.STRING,
        field: "front_img_file"
    },
    fromImgFileCode:{
        type: Sequelize.STRING,
        field: "front_img_file_code"
    },
    backImgFile:{
        type: Sequelize.STRING,
        field: "back_img_file"
    },
    backImgFileCode:{
        type: Sequelize.STRING,
        field: "back_img_file_code"
    },
    handImgFile:{
        type: Sequelize.STRING,
        field: "hand_img_file"
    },
    handImgFileCode:{
        type: Sequelize.STRING,
        field: "hand_img_file_code"
    },
    status:{
        type: Sequelize.STRING
    }
});
DomainIdentify.addAccountIdentify = function addAccountIdentify(newAccount){
    return this.findOrCreate({
        where:{
            account: newAccount.account,
            identifierType: newAccount.identifierType
        },
        defaults:{
            account: newAccount.account,
            identifierType: newAccount.identifierType,
            identifierCode: newAccount.identifier,
            frontImgFile:newAccount.front.path,
            frontImgFileCode: newAccount.front.filename,
            backImgFile: newAccount.back.path,
            backImgFileCode: newAccount.back.filename,
            handImgFile: newAccount.hand.path,
            handImgFileCode: newAccount.hand.filename,
            status: "enabled"
        }
    }).then((instanceArrays)=>{
        if(instanceArrays[1]){
            console.log(instanceArrays[0]);
        }else{
            console.log("has the identifier");
            let result = {
                code: 1103,
                message: "认证信息已经使用"
            };
        }
        return instanceArrays;
    });
};

var DomainBank = sequelize.define("t_bank", {
    account: {
        type: Sequelize.STRING
    },
    bankType:{
        type: Sequelize.STRING,
        field: "bank_type"
    },
    bankAccount:{
        type: Sequelize.STRING,
        field: "bank_account"
    },
    bankUnit:{
        type: Sequelize.STRING,
        field: "bank_unit"
    },
    status:{
        type: Sequelize.STRING
    }
});
DomainBank.createBanck = function createBank(account, info){
    //TODO 这里要带事务
    return this.findOrCreate({
        where:{
            bankAccount:info.banckAccount
        },
        defaults:{
            account: account,
            bankType: info.bankType,
            bankAccount: info.bankAccount,
            bankUnit: info.bankUnit,
            status:"using"
        }
    }).then((arrayInstance)=>{
        if(arrayInstance[1]){
            return arrayInstance[0].toJSON();
        }else{
            let alreadyInfo = arrayInstance[0].toJSON();
            if( alreadyInfo.account == account ){
                return alreadyInfo;
            }else{
                throw {
                    code: 1303,
                    message: "账号已经被使用"
                };
            }
        }
    });
};
var DomainSubscribe = sequelize.define("t_subscribe", {
    account: {
        type: Sequelize.STRING
    },
    subscribeAmount:{
        type: Sequelize.DOUBLE,
        field: "subscribe_amount"
    },
    bankType:{
        type: Sequelize.STRING,
        field: "bank_type"
    },
    bankAccount:{
        type: Sequelize.STRING,
        field: "bank_account"
    },
    bankUnit:{
        type: Sequelize.STRING,
        field: "bank_unit"
    },
    itemIndex:{
        type:Sequelize.STRING,
        field: "item_index"
    },
    status:{
        type: Sequelize.STRING
    }
});
DomainSubscribe.getSubscribeInfo = function getSubscribeInfo(account){
    return this.findAll({
        where:{
            account: account
        }
    }).then((arrayInstance)=>{
        return arrayInstance.map(ele => ele.toJSON());
    });
};

DomainSubscribe.createSubscribe = function createSubscribe(account, info){
    //TODO 这里有问题
    return this.findOrCreate({
        where:{
            account: account,
            subscribeAmount: info.subscribeAmount,
            bankType: info.bankType,
            bankAccount: info.bankAccount
        },
        defaults:{
            account: account,
            subscribeAmount: info.subscribeAmount,
            bankType: info.bankType,
            bankAccount: info.bankAccount,
            bankUnit: info.bankUnit,
            itemIndex: info
        }
    }).then((arrayInstance)=>{
        if(arrayInstance[1]){
            return arrayInstance[0].toJSON();
        }else{
            throw {
                code: 1301,
                message: "已经申购过了"
            };
        }
    });
};

var DomainDictionary = sequelize.define("t_dictionary", {
    dictName:{
        type: Sequelize.STRING,
        field: "dict_name"
    },
    dictValue:{
        type: Sequelize.STRING,
        field: "dict_value"
    },
    dictUnit:{
        type: Sequelize.STRING,
        field: "dict_unit"
    },
    dictType:{
        type: Sequelize.STRING,
        field: "dict_type"
    },
    dictSort:{
        type: Sequelize.INTEGER,
        field: "dict_sort"
    },
    status:{
        type: Sequelize.STRING,
        field: "status"
    }
});
var DomainPhoneCode = sequelize.define("t_phone_code", {
    phone:{
        type: Sequelize.STRING,
        field: "phone"
    },
    phoneCode:{
        type: Sequelize.STRING,
        field: "phone_code"
    },
    status:{
        type: Sequelize.STRING
    }
});
DomainPhoneCode.prepareAccountCode = function preppareAccountCode(phone, code){
    return this.findOrCreate({
        where:{
            phone:phone,
            created_at : {
                $gt: new Date(new Date() - 2 * 60 * 1000)
            }
        },
        defaults:{
            phone: phone,
            phoneCode:code,
            status:'sending'
        }
    }).then((arrayInstance)=>{
        if(arrayInstance[1]){//created
            return arrayInstance[0];
        }else{
            throw {
                code: 1201,
                message: "已经发送验证码了，请耐心等待"
            };
        }
    });
};
DomainPhoneCode.checkAccountCode = function checkAccountCode(newAccount){
    let validDate = new Date();
    return this.findOne({
        where:{
            phone: newAccount.phone,
            phoneCode : newAccount.phoneCode
        }
    }).then((instance)=>{
        return instance;
        /**
        if(instance){
        }else{
            throw {
                code: 1102,
                message: "无效的短信验证码"
            };
        }
         **/
    });
};

//exports.Visitor = Visitor;
exports.DomainAccount = DomainAccount;
exports.DomainIdentify = DomainIdentify;
exports.DomainBank = DomainBank;
exports.DomainSubscribe = DomainSubscribe;
exports.DomainDictionary = DomainDictionary;
exports.DomainPhoneCode = DomainPhoneCode;


