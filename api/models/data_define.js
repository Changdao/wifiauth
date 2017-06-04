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
DomainAccount.findReidsAccount = function findReidsAccount(newAccount){
    let userKey = redisKey(formats.user, newAccount.account);
    let getUser = redis.hgetallAsync(userKey);
    return getUser;
};
DomainAccount.signUpAccount = function signUpAccount(newAccount){
    let userKey = redisKey(formats.user, newAccount.account);
    return redis.hmsetAsync(userKey, newAccount)
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
    status:{
        type: Sequelize.STRING
    }
});

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

//exports.Visitor = Visitor;
exports.DomainAccount = DomainAccount;
exports.DomainIdentify = DomainIdentify;
exports.DomainBank = DomainBank;
exports.DomainSubscribe = DomainSubscribe;
exports.DomainDictionary = DomainDictionary;

