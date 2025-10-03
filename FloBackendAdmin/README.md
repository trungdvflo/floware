# FloBackendAdmin

Flo backend api for admin page

# hapi-boilerplate

Starting a new project API with HAPI

## Features

-   Supports OAuth 2.0
-   Auto generate Document with _Swagger_
-   Object schema description language and validation with Joi Language
-   Can be used with _promises_, _Node-style callbacks_, _ES6 generators_ and _async_/_await_.
-   Implicitly supports any form of storage, e.g. _Elasticsearch_, _MySQL_, _MongoDB_, _Redis_, etc.

## Installation

```bash
npm install
```

-   With local dev

```bash
npm install -g nodemon
```

## Configure

-   Env

```bash
NODE_ENV=test
BASE_URL='http://localhost:1311'
BASE_PATH='/'
HOST='localhost'
PORT=1311
DB_DEBUG=true

DB_HOST= 'localhost'
DB_PORT= 3306
DB_USER= 'root'
DB_PASS= 'root'
DB_NAME= 'flowdata'
DB_DEBUG= 'false'
DB_MAX_POOL= 100

LOG_HOST = 'localhost'
LOG_PORT = 12201

REDIS_HOST='localhost'
REDIS_PORT=16379
REDIS_DB='0'
REDIS_AUTH='localhost'

AWS_S3_ACCESS_KEY_ID='ABCDEF'
AWS_S3_SECRET_ACCESS_KEY='OLKMNH'
AWS_S3_ENDPOINT='https://s3.us-west-1.example.com'
AWS_S3_REGION='us-west-1'
AWS_S3_BUCKET='example'

DELETED_USER_CLEANING_WAIT_TIME_SECOND=60000
```

## Usage

-   Start with npm

```bash
npm start
```

## Documentation

```bash
http://[domain]:[port]/documentation
```
