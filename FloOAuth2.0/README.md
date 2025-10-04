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
      ENV_DISPLAY_NAME=''
      NODE_ENV=
      BASE_URL=''
      BASE_PATH=''
      HOST=''
      PORT=1314

      AWS_SM_NAME=''
      DB_HOST=''
      DB_PORT=3306
      DB_USER=''
      DB_PASS=''
      DB_NAME=''
      DB_DEBUG=''
      DB_MAX_POOL=''
      REAL_NAME_DAV=''
      RSA_PRIVATE_KEY_PATH=''

      REDIS_HOST=''
      REDIS_PORT=
      REDIS_AUTH=''
      REDIS_DB=''

      SWAGGER_API_URL=''
      SWAGGER_UI_ENABLED=''
      FLO_AES_KEY=''
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
