# hapi-boilerplate
Starting a new project API with HAPI

## Features

- Supports OAuth 2.0
- Auto generate Document with *Swagger*
- Object schema description language and validation with Joi Language
- Can be used with *promises*, *Node-style callbacks*, *ES6 generators* and *async*/*await*.
- Implicitly supports any form of storage, e.g. *Elasticsearch*, *MySQL*, *MongoDB*, *Redis*, etc.

## Installation

```bash
npm install 
```
- With local dev
```bash
npm install -g nodemon
```

## Configure
- Env
 ```bash
    NODE_ENV=development
    BASE_URL= 'http://localhost:1312'
    BASE_PATH= '/'
    DB_HOST= 'DB_HOST'
    DB_PORT= DB_PORT
    DB_USER= 'DB_USER'
    DB_PASS= 'DB_PASS'
    DB_NAME= 'DB_NAME'
    HOST= '127.0.0.1'
    PORT= 1312
    PUSH_NOTIFY_KEY_PATH= 'PUSH_NOTIFY_KEY_PATH'
    KEY_MAP_PUSH_NOTIFY= 'KEY_MAP_PUSH_NOTIFY'

    AWS_ACCESS_KEY_ID='AWS_ACCESS_KEY_ID'
    AWS_SECRET_ACCESS_KEY='AWS_SECRET_ACCESS_KEY'
    AWS_SM_NAME= 'AWS_SM_NAME'
    AWS_REGION= 'AWS_REGION'
    AWS_ACCOUNT_ID= 'AWS_ACCOUNT_ID'
    AWS_API_VERSION= 'AWS_API_VERSION'

    DOVECOT_NEW_MAIL_QUEUE_NAME= 'DOVECOT_NEW_MAIL_QUEUE_NAME'
 ```

## Usage

 - Start with npm 
 ```bash
 npm start
 ```

## Documentation

 ```bash
 http://[domain]:[port]/documentation
 ```
