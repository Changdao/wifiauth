create table if not exists t_account (
   id bigserial primary key,
   account varchar(400),
   account_name varchar(1000),
   phone varchar(40),
   gender integer,
   avatar varchar(1000),
   password varchar(200) default '123456',
   created_at timestamp default current_timestamp,
   status varchar(40),
   promoter integer,
   updated_at timestamp,
   account_type integer
);

create table if not exists t_account_relation (
    id bigserial primary key,
    parent varchar(400),
    account varchar(400),
    account_name varchar(1000),
    shop_id bigint,
    status varchar(40),
    relation_type varchar(40),
    created_at timestamp default current_timestamp,
    updated_at timestamp
);

create table if not exists t_area (
    id serial primary key,
    area_name varchar(400),
    area_index varchar(400),
    status varchar(40),
    created_at timestamp default current_timestamp,
    updated_at timestamp,
    latitude double precision,
    longitude double precision
);

create table if not exists t_shop (
   id bigserial primary key,
   shop_name varchar(400),
   shop_address varchar(1000),
   owner_account_id integer,
   owner_account varchar(400),
   area_id integer,
   area_index varchar(400),
   created_at timestamp default current_timestamp,
   updated_at timestamp
);

create table if not exists t_coupon_strategy(
   id bigserial primary key,
   strategy_name varchar(400),
   data json,
   status varchar(40),
   origin varchar(400),
   created_at timestamp default current_timestamp,
   updated_at timestamp
);

create table if not exists t_coupon_strategy_access(
   id bigserial primary key,
   strategy_id bigint,
   shop_id bigint,
   status varchar(40),
   created_at timestamp default current_timestamp,
   updated_at timestamp
);

create table if not exists t_coupon_template (
   id bigserial primary key,
   coupon_template_name varchar(400),
   data json,
   strategy_id bigint,
   shop_id bigint,
   status varchar(40),
   origin varchar(400),
   maxcount integer,
   begin_time timestamp,
   end_time timestamp,
   publish integer,
   created_at timestamp default current_timestamp,
   updated_at timestamp
);

create table if not exists t_coupon_instance (
   id bigserial primary key,
   coupon_instance_name varchar(400),
   data json,
   account_id bigint,
   account varchar(400),
   account_name varchar(1000),
   status varchar(40),
   template_id bigint,
   shop_id bigint,
   shop_name varchar(400),
   shop_address varchar(1000),
   origin varchar(40),
   random_id integer,
   created_at timestamp default current_timestamp,
   updated_at timestamp
);

create table if not exists t_coupon_consumption (
    id bigserial primary key,
    coupon_instance_id integer,
    shop_id integer,
    account_consumer_id integer,
    account_consumer varchar(400),
    account_clerk_id integer,
    account_clerk varchar(400),
    latitude double precision,
    longitude double precision,
    created_at timestamp default current_timestamp,
    updated_at timestamp
);




insert into t_account ( account, account_name, phone, gender, avatar, status, account_type) values ('admin','administrator', '13718961111', 0, null, 'enabled', 1000 );
insert into t_account ( account, account_name, phone, gender, avatar, status, account_type) values ('wuchunhua','吴春华', '13718961112', 2, null, 'enabled', 1000 );
insert into t_account ( account, account_name, phone, gender, avatar, status, account_type) values ('clerk','clerk', '13718961113', 0, null, 'enabled', 100 );
insert into t_account ( account, account_name, phone, gender, avatar, status, account_type) values ('wangminghua','wangminghua', '13718961114', 1, null, 'enabled', 100 );
insert into t_account ( account, account_name, phone, gender, avatar, status, account_type) values ('shop','shop', '13718961115', 0, null, 'enabled', 120 );
insert into t_account ( account, account_name, phone, gender, avatar, status, account_type) values ('chenwulin','chenwulin', '13718961116', 1, null, 'enabled', 120 );
insert into t_account ( account, account_name, phone, gender, avatar, status, account_type) values ('brand','brand', '137189611117', 0, null, 'enabled', 160 );
insert into t_account ( account, account_name, phone, gender, avatar, status, account_type) values ('liujidong','liujidong', '13718961118', 1, null, 'enabled', 160 );
insert into t_account ( account, account_name, phone, gender, avatar, status, account_type) values ('market','market', '13718961119', 0, null, 'enabled', 200 );
insert into t_account ( account, account_name, phone, gender, avatar, status, account_type) values ('cuipeng','cuipeng', '13718961120', 1, null, 'enabled', 200 );
insert into t_account ( account, account_name, phone, gender, avatar, status, account_type) values ('customer','customer', '13718961121', 0, null, 'enabled', 0 );
insert into t_account ( account, account_name, phone, gender, avatar, status, account_type) values ('liuhanru','liuhanru', '13718961122', 1, null, 'enabled', 0 );


    
