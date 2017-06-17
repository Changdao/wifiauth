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
   account_type integer,
   unique( account )
);

create table if not exists t_identify (
   id bigserial primary key,
   account varchar(400),
   identifier_type varchar(40),
   identifier_code varchar(40),
   front_img_file varchar(1000),
   front_img_file_code varchar(100),
   back_img_file varchar(1000),
   back_img_file_code varchar(100),
   hand_img_file varchar(1000),
   hand_img_file_code varchar(100),
   status varchar(40),
   created_at timestamp default current_timestamp,
   updated_at timestamp,
   unique( identifier_type, identifier_code )
);

create table if not exists t_bank (
   id bigserial primary key,
   account varchar(400),
   bank_type varchar(400),
   bank_account varchar(400) default 'unkown',
   bank_unit varchar(40),
   status varchar(40),
   created_at timestamp default current_timestamp,
   updated_at timestamp,
   unique ( account, bank_type ),
   unique ( bank_type, bank_account)
);

create table if not exists t_subscribe (
   id bigserial primary key,
   account varchar(400),
   subscribe_amount double precision,
   bank_type varchar(400),
   bank_account varchar(400),
   bank_unit varchar(40),
   status varchar(40),
   item_index varchar(100),
   created_at timestamp default current_timestamp,
   updated_at timestamp,
   unique ( account, bank_type),
   unique ( bank_type, bank_account)
);

create table if not exists t_dictionary (
   id bigserial primary key,
   dict_name varchar(400),
   dict_value varchar(40),
   dict_unit varchar(40),
   dict_type varchar(40),
   dict_sort integer,
   status varchar(40),
   created_at timestamp default current_timestamp,
   updated_at timestamp
);

create table if not exists t_phone_code (
   id bigserial primary key,
   uuid varchar(100),
   application varchar(40),
   phone varchar(40),
   phone_code varchar(40),
   status varchar(40) default 'enabled',
   created_at timestamp default current_timestamp,
   updated_at timestamp
);

create table if not exists t_request_mask (
   id bigserial primary key,
   request_url varchar(1000),
   mask_code varchar(40),
   status varchar(40),
   created_at timestamp default current_timestamp,
   updated_at timestamp
);



ALTER TABLE t_bank ADD CONSTRAINT t_bank_account_bank_type UNIQUE (account, bank_type);

ALTER TABLE public.t_bank
    ADD CONSTRAINT banktypebankaccount UNIQUE (bank_type, bank_account);

ALTER TABLE public.t_subscribe
    ADD CONSTRAINT subscribebanktypebankaccount UNIQUE (bank_type, bank_account);


ALTER TABLE t_subscribe ADD CONSTRAINT t_subscribe_account_bank_type UNIQUE ( account, bank_type );


ALTER TABLE public.t_subscribe DROP CONSTRAINT t_subscribe_account_bank_type;

ALTER TABLE public.t_bank DROP CONSTRAINT t_bank_account_bank_type;

create index if not exists t_bank_account_bank_type_bank_account on t_bank (account, bank_type, bank_account);

create index if not exists t_subscribe_account_bank_type_bank_account on t_subscribe (account, bank_type, bank_account);


ALTER TABLE public.t_subscribe DROP CONSTRAINT banktypebankaccount;

ALTER TABLE public.t_subscribe
    ADD CONSTRAINT t_subscribe_bank_type_bank_account_subscribe_amount UNIQUE (bank_type, bank_account, subscribe_amount);


