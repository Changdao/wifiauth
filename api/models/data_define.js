var Sequelize = require('../../config/database/sequelize').Sequelize;
var sequelize = require('../../config/database/sequelize').sequelize;
require('pg').types.setTypeParser(1114, stringValue => {
    return new Date(stringValue + "+0000");
    // e.g., UTC offset. Use any offset that you would like.
});
var bluebird = require('bluebird');
var redisdb = require('redis');
var redis = redisdb.createClient();
bluebird.promisifyAll(redisdb.RedisClient.prototype);
bluebird.promisifyAll(redisdb.Multi.prototype);

var formats = {
    user: 'users:',
    token: "tokens:"
};
var redisKey = function redisKey(key, keyValue) {
    return `${key}${keyValue}`;
};

var DomainAccount = sequelize.define('t_account', {
    account: {
        type: Sequelize.STRING
    },
    accountName: {
        type: Sequelize.STRING,
        field: "account_name"
    },
    phone: {
        type: Sequelize.STRING
    },
    gender: {
        type: Sequelize.INTEGER
    },
    avatar: {
        type: Sequelize.STRING
    },
    password: {
        type: Sequelize.STRING
    },
    createdAt: {
        type: Sequelize.DATE,
        field: "created_at"
    },
    status: {
        type: Sequelize.STRING
    },
    promoter: {
        type: Sequelize.INTEGER
    },
    accountType: {
        type: Sequelize.INTEGER,
        field: "account_type"
    }
});

function signUpAccountOfDomain(newAccount, minutes) {
    let userKey = redisKey(formats.user, newAccount.account);
    let getUser = redis.hgetallAsync(userKey);
    let accountInfo = {
        username: newAccount.account,
        password: newAccount.password
    };
    return sequelize.transaction((trans) => {
        newAccount.application = newAccount.application || 'register';
        let curDateLimit = new Date(new Date() - (minutes || 10) * 60 * 1000);
        return DomainPhoneCode.findOne({
            where: {
                phone: newAccount.phone,
                application: newAccount.application,
                status: "sent",
                createdAt: {
                    $gt: curDateLimit
                },
                phoneCode: newAccount.phoneCode
            },
            transaction: trans
        }).then((instance) => {
            if (!instance) {
                throw {
                    code: 1102,
                    message: "无效的短信验证码"
                };
            } else {
                return instance;
            }
        }).then((phoneCodeInstance) => {
            return DomainAccount.findOrCreate({
                where: {
                    account: newAccount.account
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
                },
                transaction: trans
            });
        }).then((accountInstanceArray) => {
            if (!(accountInstanceArray[1])) {
                throw {
                    code: 1103,
                    message: "已经存在此用户授权同步出错。redis与psql不一致。"
                };
            } else {
                return accountInstanceArray[0];
            };
        }).then((accountInstance) => {
            return DomainIdentify.findOrCreate({
                where: {
                    account: newAccount.account,
                    identifierType: newAccount.identifierType
                },
                defaults: {
                    account: newAccount.account,
                    identifierType: newAccount.identifierType,
                    identifierCode: newAccount.identifier,
                    frontImgFile: newAccount.front.path,
                    frontImgFileCode: newAccount.front.filename,
                    backImgFile: newAccount.back.path,
                    backImgFileCode: newAccount.back.filename,
                    handImgFile: newAccount.hand.path,
                    handImgFileCode: newAccount.hand.filename,
                    status: "enabled"
                },
                transaction: trans
            });
        }).then((identifyInstanceArray) => {
            if (identifyInstanceArray[1]) {
                return identifyInstanceArray[0];
            } else {
                throw {
                    code: 1103,
                    message: "认证信息已经使用"
                };
            }
        }).then((identifyInstance) => {
            return redis.hmsetAsync(userKey, accountInfo);
        });
    }).catch((error) => {
        return redis.delAsync(userKey).then((deluser) => {
            throw error;
        });
    });;
};
DomainAccount.signUpAccount = function signUpAccount(newAccount) {
    return DomainAccount.findRedisAccount(newAccount).then((user) => {
        return signUpAccountOfDomain(newAccount, 5);
    }).then((identifyInstance) => {
        return {
            code: 0,
            message: "ok"
        };
    });
};
DomainAccount.findRedisAccount = function findReidsAccount(newAccount) {
    let userKey = redisKey(formats.user, newAccount.account);
    let hasTheUser = redis.hgetallAsync(userKey);
    return hasTheUser.then((user) => {
        if (user) {
            throw {
                code: 1101,
                message: "已经存在此用户"
            };
        } else {
            return user;
        }
    });
};
DomainAccount.getAccountInfo = function getAccountInfo(authUser) {
    return this.findOne({
        where: {
            account: authUser.id
        }
    });
};
DomainAccount.testPhoneExist = function testPhoneExist(phone) {
    return this.findOne({
        where: {
            phone: phone
        }
    });
};
DomainAccount.deleteAccountFromRedis = function deleteAccountFromRedis(account) {
    let userKey = redisKey(formats.user, account);
    return redis.delAsync(userKey).then((deled) => {
        return this.update({ status: "disabled" }, {
            where: {
                account
            }
        });
    });
};
DomainAccount.resetPassword = function resetPassword(resetData, minutes) {
    let curDateLimit = new Date(new Date() - (minutes || 10) * 60 * 1000);
    return sequelize.transaction((trans) => {
        return DomainPhoneCode.findOne({
            where: {
                phone: resetData.account,
                application: resetData.application || 'resetPassword',
                status: "sent",
                createdAt: {
                    $gt: curDateLimit
                },
                phoneCode: resetData.phoneCode
            },
            transaction: trans
        }).then((instance) => {
            if (!instance) {
                throw {
                    code: 1102,
                    message: "无效的短信验证码",
                    application: 'resetPassword'
                };
            } else {
                return instance;
            }
        }).then((instanceOfPhoneCode) => {
            return DomainAccount.update({
                password: resetData.password
            }, {
                where: {
                    account: resetData.account
                }
            })
        }).then((updateResult) => {
            let userKey = redisKey(formats.user, resetData.account);
            let accountInfo = {
                username: resetData.account,
                password: resetData.password
            };
            return redis.hmsetAsync(userKey, accountInfo);
        });
    });
}

var DomainIdentify = sequelize.define("t_identify", {
    account: {
        type: Sequelize.STRING
    },
    identifierType: {
        type: Sequelize.STRING,
        field: "identifier_type"
    },
    identifierCode: {
        type: Sequelize.STRING,
        field: "identifier_code"
    },
    identifierType: {
        type: Sequelize.STRING,
        field: "identifier_type"
    },
    frontImgFile: {
        type: Sequelize.STRING,
        field: "front_img_file"
    },
    fromImgFileCode: {
        type: Sequelize.STRING,
        field: "front_img_file_code"
    },
    backImgFile: {
        type: Sequelize.STRING,
        field: "back_img_file"
    },
    backImgFileCode: {
        type: Sequelize.STRING,
        field: "back_img_file_code"
    },
    handImgFile: {
        type: Sequelize.STRING,
        field: "hand_img_file"
    },
    handImgFileCode: {
        type: Sequelize.STRING,
        field: "hand_img_file_code"
    },
    status: {
        type: Sequelize.STRING
    }
});

var DomainBank = sequelize.define("t_bank", {
    account: {
        type: Sequelize.STRING
    },
    bankType: {
        type: Sequelize.STRING,
        field: "bank_type"
    },
    bankAccount: {
        type: Sequelize.STRING,
        field: "bank_account"
    },
    bankUnit: {
        type: Sequelize.STRING,
        field: "bank_unit"
    },
    status: {
        type: Sequelize.STRING
    }
});
DomainBank.createBank = function createBank(authUser, info, trans) {
    return this.findOrCreate({
        where: {
            bankAccount: info.banckAccount
        },
        defaults: {
            account: authUser.id,
            bankType: info.bankType,
            bankAccount: info.bankAccount,
            bankUnit: info.bankUnit,
            status: "using"
        }
    }, { transaction: trans }).then((arrayInstance) => {
        console.log(arrayInstance);
        if (arrayInstance[1]) {
            return arrayInstance[0].toJSON();
        } else {
            let alreadyInfo = arrayInstance[0].toJSON();
            if (alreadyInfo.account == authUser.id) {
                return alreadyInfo;
            } else {
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
    subscribeAmount: {
        type: Sequelize.DOUBLE,
        field: "subscribe_amount"
    },
    bankType: {
        type: Sequelize.STRING,
        field: "bank_type"
    },
    bankAccount: {
        type: Sequelize.STRING,
        field: "bank_account"
    },
    bankUnit: {
        type: Sequelize.STRING,
        field: "bank_unit"
    },
    itemIndex: {
        type: Sequelize.STRING,
        field: "item_index"
    },
    createdAt: {
        type: Sequelize.DATE,
        field: "created_at"
    },
    status: {
        type: Sequelize.STRING
    }
});
DomainSubscribe.getSubscribeInfo = function getSubscribeInfo(authUser, query) {
    return this.findAll({
        where: {
            account: authUser.id
        },
        limit: query.limit,
        offset: query.offset
    }).then((arrayInstance) => {
        console.log("find info:" + arrayInstance);
        return arrayInstance.map(ele => ele.toJSON());
    });
};

DomainSubscribe.createSubscribe = function createSubscribe(authUser, info) {
    return sequelize.transaction((trans) => {
        return DomainBank.findOrCreate({
            where: {
                bankType: info.bankType,
                bankAccount: info.bankAccount
            },
            defaults: {
                account: authUser.id,
                bankType: info.bankType,
                bankAccount: info.bankAccount,
                bankUnit: info.bankUnit,
                status: "using"
            },
            transaction: trans
        }).then((bankInstanceArray) => {
            let bankInstance = bankInstanceArray[0];
            if (!bankInstanceArray[1]) { //has the record, need check the user, 需要设置地址
                bankInstance.set('bankAccount', info.bankAccount);
                return bankInstance.save({ transaction: trans });
            };
            return bankInstance;
        }).then((bankInstance) => {
            return DomainSubscribe.findOrCreate({
                where: {
                    account: authUser.id,
                    bankType: info.bankType,
                    bankAccount: info.bankAccount,
                    subscribeAmount: info.subscribeAmount,
                    createdAt: undefined
                },
                defaults: {
                    account: authUser.id,
                    subscribeAmount: info.subscribeAmount,
                    bankType: info.bankType,
                    bankAccount: info.bankAccount,
                    bankUnit: info.bankUnit,
                    status: "waiting"
                },
                transaction: trans
            });
        }).then((subscribeInstanceArray) => {
            let subscribeInstance = subscribeInstanceArray[0];
            if (!subscribeInstanceArray[1]) {
                subscribeInstance.set("subscribeAmount", info.subscribeAmount);
                subscribeInstance.set("bankAccount", info.bankAccount);
                return subscribeInstance.save({ transaction: trans });
            }
            return subscribeInstance;
        }).then((subscribeInstance) => {
            return subscribeInstance.toJSON();
        });
    }).catch((error) => {
        //地址异常
        throw {
            code: 1303,
            message: `${info.bankType}\'s ${info.bankAccount} has been used.`
        };
    });
};

var DomainDictionary = sequelize.define("t_dictionary", {
    dictName: {
        type: Sequelize.STRING,
        field: "dict_name"
    },
    dictValue: {
        type: Sequelize.STRING,
        field: "dict_value"
    },
    dictUnit: {
        type: Sequelize.STRING,
        field: "dict_unit"
    },
    dictType: {
        type: Sequelize.STRING,
        field: "dict_type"
    },
    dictSort: {
        type: Sequelize.INTEGER,
        field: "dict_sort"
    },
    status: {
        type: Sequelize.STRING,
        field: "status"
    }
});
var DomainPhoneCode = sequelize.define("t_phone_code", {
    uuid: {
        type: Sequelize.STRING,
        field: "uuid"
    },
    application: {
        type: Sequelize.STRING
    },
    phone: {
        type: Sequelize.STRING,
        field: "phone"
    },
    phoneCode: {
        type: Sequelize.STRING,
        field: "phone_code"
    },
    createdAt: {
        type: Sequelize.DATE,
        field: "created_at"
    },
    status: {
        type: Sequelize.STRING
    },
    verifyCode: {
        type: Sequelize.STRING,
        field: "verify_code"
    }
});
DomainPhoneCode.preparePhoneCode = function preparePhoneCode(codeInfo) {
    return this.findOrCreate({
        where: {
            uuid: codeInfo.uuid,
            application: codeInfo.application,
            status: 'sending'
        },
        defaults: {
            uuid: codeInfo.uuid,
            phoneCode: codeInfo.code,
            application: codeInfo.application,
            status: 'sending'
        }
    }).then((arrayInstance) => {
        if (arrayInstance[1]) { //created
            return arrayInstance[0].toJSON();
        } else {
            throw {
                code: 1201,
                message: "已经准备好注册了",
                info: arrayInstance[0].toJSON()
            };
        }
    });
};
DomainPhoneCode.sendPhoneCode = function sendPhoneCode(codeInfo) {
    return this.findOne({
        where: {
            id: codeInfo.id,
            uuid: codeInfo.uuid,
            application: codeInfo.application
        }
    }).then((codeInstance) => {
        console.log(codeInstance);
        if (codeInstance.get('verifyCode') != codeInfo.verifyCode) {
            throw {
                code: 1503,
                message: "人机验证码不正确"
            };
        }
        codeInstance.set("status", "sent");
        codeInstance.set("phone", codeInfo.phone);
        return codeInstance.save();
    }).then((codeInstance) => {
        return codeInstance.toJSON();
    });
};
DomainPhoneCode.refreshVerifyCode = function refreshVerifyCode(codeInfo) {
    return this.update({ verifyCode: codeInfo.verifyCode }, {
        where: {
            id: codeInfo.id,
            uuid: codeInfo.uuid
        }
    }).then((arrayInstance) => {
        if (arrayInstance[0] == 1) {
            return arrayInstance[0];
        } else {
            throw {
                code: 1502,
                message: "请求的数据不存在: id, uuid"
            };
        }
    });
};
var DomainTxEthList = sequelize.define("t_tx_eth_list", {
    hash: {
        type: Sequelize.STRING,
        field: "tx_hash"
    },
    sender: {
        type: Sequelize.STRING,
        field: "tx_sender"
    },
    recipient: {
        type: Sequelize.STRING,
        field: "recipient"
    },
    accountNonce: {
        type: Sequelize.STRING,
        field: "accountnonce"
    },
    price: {
        type: Sequelize.BIGINT,
        field: "price"
    },
    gasLimit: {
        type: Sequelize.BIGINT,
        field: "gas_limit"
    },
    amount: {
        type: Sequelize.DECIMAL,
        field: "amount"
    },
    block_id: {
        type: Sequelize.BIGINT,
        field: "block_id"
    },
    time: {
        type: Sequelize.DATE,
        field: "tx_time"
    },
    newContract: {
        type: Sequelize.BIGINT,
        field: "new_contract"
    },
    isContractTx: {
        type: Sequelize.STRING,
        field: "is_contract_tx"
    },
    blockHash: {
        type: Sequelize.STRING,
        field: "block_hash"
    },
    parentHash: {
        type: Sequelize.STRING,
        field: "parent_hash"
    },
    txIndex: {
        type: Sequelize.STRING,
        field: "tx_index"
    },
    gasUsed: {
        type: Sequelize.BIGINT,
        field: "gas_used"
    },
    type: {
        type: Sequelize.STRING,
        field: "tx_type"
    },
    status: {
        type: Sequelize.STRING,
        field: "status"
    },
    account: {
        type: Sequelize.STRING,
        field: "account"
    }
});
DomainTxEthList.insertTxList = function insertTxList(ethArray) {
    return Promise.all(ethArray.map((ele) => {
        return this.findOrCreate({
            where: {
                sender: ele.sender,
                recipient: ele.recipient,
                hash: ele.hash,
                time: ele.time
            },
            defaults: ele
        });
    })).then((createArray) => {
        let hasData = createArray.length > 0;
        let hasNewData = hasData && createArray[0][0];
        if (hasData && createArray[0][1]) {
            let sql = `update t_bank as bank set ( amount_in, usent ) = ( 
                select rs.hamount, rs.gasused from (
                    select sum(amount)/1000000000000000000 as hamount, sum(gas_used) as gasused, tx_sender, recipient from t_tx_eth_list
                    where lower(recipient)=lower('0xecc472db4a32fd84f3bbaa261bf4598b66fc6cf2')
                    group by tx_sender, recipient 
                ) as rs
                where lower(bank.bank_account) = lower(rs.tx_sender)
            )
            where bank.bank_type = 'ETH'`;
            return sequelize.query(sql, { type: sequelize.QueryTypes.UPDATE });
        } else {
            throw {
                code: 1101,
                message: 'no data changed'
            };
        };
    }).then((instanceArray) => {
        let sql = `update t_bank as bank set ( amount_out ) = ( 
            select rs.hamount from (
                select sum(amount)/1000000000000000000 as hamount, tx_sender, recipient from t_tx_eth_list
                where lower(tx_sender)=lower('0xecc472db4a32fd84f3bbaa261bf4598b66fc6cf2')
                group by tx_sender, recipient 
            ) as rs
            where lower(bank.bank_account) = lower(rs.recipient)
        )
        where bank.bank_type = 'ETH'`;
        return sequelize.query(sql, { type: sequelize.QueryTypes.UPDATE });
    });
};
var DomainTxBtcInput = sequelize.define("t_tx_btc_input", {
    ver: {
        type: Sequelize.INTEGER,
        field: "btc_ver"
    },
    sequence: {
        type: Sequelize.BIGINT,
        field: "seq"
    },
    spent: {
        type: Sequelize.BOOLEAN,
        field: "spent"
    },
    preTxIndex: {
        type: Sequelize.BIGINT,
        field: "pre_tx_index"
    },
    preType: {
        type: Sequelize.INTEGER,
        field: "pre_tx_type"
    },
    addr: {
        type: Sequelize.STRING,
        field: "addr"
    },
    value: {
        type: Sequelize.BIGINT,
        field: "pre_value"
    },
    n: {
        type: Sequelize.INTEGER,
        field: "n"
    },
    preScript: {
        type: Sequelize.STRING,
        field: "pre_script"
    },
    inputScript: {
        type: Sequelize.STRING,
        field: "input_script"
    },
    block_height: {
        type: Sequelize.INTEGER,
        field: "block_height"
    },
    relayed_by: {
        type: Sequelize.STRING,
        field: "relayed_by"
    },
    lock_time: {
        type: Sequelize.INTEGER,
        field: "lock_time"
    },
    result: {
        type: Sequelize.INTEGER,
        field: "tx_result"
    },
    txSize: {
        type: Sequelize.INTEGER,
        field: "tx_size"
    },
    txTime: {
        type: Sequelize.INTEGER,
        field: "tx_time"
    },
    txIndex: {
        type: Sequelize.INTEGER,
        field: "tx_index"
    },
    vinSz: {
        type: Sequelize.INTEGER,
        field: "vin_sz"
    },
    hash: {
        type: Sequelize.STRING,
        field: "tx_hash"
    },
    voutSz: {
        type: Sequelize.INTEGER,
        field: "vout_sz"
    },
    txMethod: {
        type: Sequelize.INTEGER,
        field: "tx_method"
    }
});
DomainTxBtcInput.insertTxList = function insertTxList(ethArray) {
    return Promise.all(ethArray.map((ele) => {
        return this.findOrCreate({
            where: {
                hash: ele.hash,
                preScript: ele.preScript,
                addr: ele.addr,
                preTxIndex: ele.preTxIndex,
                txIndex: ele.txIndex
            },
            defaults: ele
        });
    })).then((createArray) => {
        let hasData = createArray.length > 0;
        let hasNewData = hasData && createArray[0][0];
        if (hasData && createArray[0][1]) {
            let sql = `
            update t_bank as bank set ( amount_in ) = (
                select ins.ivalue from (
                    select sum(txi.pre_value) /100000000  as ivalue, 
                    txi.addr as iaddr
                    -- , txi.tx_hash as ihash, txi.pre_script as iscript, txi.pre_tx_index as ipre_index, txi.tx_index as itx_index 
                    from t_tx_btc_input as txi where tx_method = 1
                    group by iaddr
                    -- , ihash, iscript, ipre_index, itx_index
                ) as ins
                where lower(bank.bank_account) = lower(ins.iaddr)
            )
            where bank.bank_type = 'BTC'`;
            return sequelize.query(sql, { type: sequelize.QueryTypes.UPDATE });
            // return sequelize.query(sql, {type: sequelize.QueryTypes.UPDATE});
        } else {
            throw {
                code: 1101,
                message: 'no data changed'
            };
        };
    }).then((instanceArray) => {
        let sql = `
        update t_bank as bank set ( amount_out ) = (
            select ins.ivalue from (
                select sum(txi.pre_value) /100000000  as ivalue, 
                txi.addr as iaddr
                -- , txi.tx_hash as ihash, txi.pre_script as iscript, txi.pre_tx_index as ipre_index, txi.tx_index as itx_index 
                from t_tx_btc_input as txi where tx_method = 2
                group by iaddr
                -- , ihash, iscript, ipre_index, itx_index
            ) as ins
            where lower(bank.bank_account) = lower(ins.iaddr)
        )
        where bank.bank_type = 'BTC'
        `;
        return sequelize.query(sql, { type: sequelize.QueryTypes.UPDATE });
    });
};

var DomainChecked = sequelize.define("t_checked", {
    accountName: {
        type: Sequelize.STRING,
        field: "account_name"
    },
    gender: {
        type: Sequelize.INTEGER,
        field: "gender"
    },
    identifierType: {
        type: Sequelize.STRING,
        field: "identifier_type"
    },
    identifierCode: {
        type: Sequelize.STRING,
        field: "identifier_code"
    },
    frontImgFile: {
        type: Sequelize.STRING,
        field: "front_img_file"
    },
    backImgFile: {
        type: Sequelize.STRING,
        field: "back_img_file"
    },
    handImgFile: {
        type: Sequelize.STRING,
        field: "hand_img_file"
    },
    account: {
        type: Sequelize.STRING,
        field: "account"
    },
    bankType: {
        type: Sequelize.STRING,
        field: "bank_type"
    },
    bankAccount: {
        type: Sequelize.STRING,
        field: "bank_account"
    },
    bankUnit: {
        type: Sequelize.STRING,
        field: "bank_unit"
    },
    status: {
        type: Sequelize.STRING,
        field: "status"
    },
    amountIn: {
        type: Sequelize.DOUBLE,
        field: "amount_in"
    },
    amountOut: {
        type: Sequelize.DOUBLE,
        field: "amount_out"
    },
    usent: {
        type: Sequelize.DOUBLE,
        field: "usent"
    },
    userName: {
        type: Sequelize.STRING,
        field: "user_name"
    },
    confirmedAddress: {
        type: Sequelize.STRING,
        field: "confirmed_address"
    },
    confirmedAmount: {
        type: Sequelize.DOUBLE,
        field: "confirmed_amount"
    }
});

var DomainSMS = sequelize.define("t_sms", {
    account: {
        type: Sequelize.STRING,
        field: "account"
    },
    message: {
        type: Sequelize.STRING,
        field: "message"
    },
    status: {
        type: Sequelize.STRING,
        field: "status"
    },
    usages: {
        type: Sequelize.STRING,
        field: "usages"
    }
});

var DomainUBCAddress = sequelize.define("t_ubc_address", {
    account: {
        type: Sequelize.STRING,
        field: "account"
    },
    ubcVersion: {
        type: Sequelize.INTEGER,
        field: "ubc_version"
    },
    address: {
        type: Sequelize.STRING,
        field: "address"
    },
    status: {
        type: Sequelize.STRING,
        field: "status"
    },
    amount: {
        type: Sequelize.DOUBLE,
        field: "amount"
    }
});

//exports.Visitor = Visitor;
exports.DomainAccount = DomainAccount;
exports.DomainIdentify = DomainIdentify;
exports.DomainBank = DomainBank;
exports.DomainSubscribe = DomainSubscribe;
exports.DomainDictionary = DomainDictionary;
exports.DomainPhoneCode = DomainPhoneCode;
exports.DomainTxEthList = DomainTxEthList;
exports.DomainTxBtcInput = DomainTxBtcInput;
exports.DomainChecked = DomainChecked;
exports.DomainSMS = DomainSMS;
exports.DomainUBCAddress = DomainUBCAddress;