Place your controllers in this directory.

# 账号相关 account.js # 

## ninecoupon/signup : createAccount ##

### request ###
  * body:account
  * body:password

### response ###
  * 成功或者失败

## ninecoupon/anonymous : anonymousAccount ##

### request ###
  * body:account
  * body:password

### response ###
  * 成功或者失败

## ninecoupon/account : getAccount ##

### request ###
  * header: Authentication:Bearer ${accessCode}

### response ###
  * id": "13",
  * "account": "liuhanru3",
  * "accountName": null,
  * "phone": null,
  * "gender": null,
  * "avatar": null,
  * "password": "123456",
  * "createAt": "2017-05-09T01:15:33.633Z",
  * "status": null,
  * "promoter": null,
  * "accountType": null,
  * "created\_at": "2017-05-09T01:15:33.633Z",
  * "updated\_at": "2017-05-09T01:15:33.633Z"


# 核销相关 consumption #

