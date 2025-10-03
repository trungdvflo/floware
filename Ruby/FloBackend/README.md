# FloBackend

# Setup ENV
##### Setup for development
Create `.env` file follow params below:

```bash
SMTP_EMAIL_FROM=''
SMTP_EMAIL_ADDRESS=''
SMTP_EMAIL_PASSWORD=''
EMAIL_DOMAIN=''
MYSQL_USERNAME=''
MYSQL_PASSWORD=''
MYSQL_HOST=''
SECRET_KEY_BASE=''
EMAIL_SERVER=''
RECAPTCHA_PRIVATE_KEY=''
ZENDESK_SHARED_SECRET=''
REDIS_HOST='localhost'
REDIS_PORT=6379
HTTP_HOST_NAME=''
FLOL_CALDAV_SERVER_URL=''
HTTP_HOST_NAME_BG=''
HTTP_HOST_NAME_FOR_BETA=''
FLOL_CARDDAV_SERVER_URL=''
IMAP_FOLDER_PATH=''
API_FROM_EMAIL_SUPPORT=''
UPLOAD_FILE_PATH=''
PUSH_NOTI_LIB_PATH=''
PUSH_NOTI_PEM_FILE=''
RSA_PRIVATE_KEY=''
RSA_PUBLIC_KEY=''
```

##### Setup for production
Add to `.bashrc`

```bash
#123flo server

export SMTP_EMAIL_FROM='support@123flo.com'
export SMTP_EMAIL_ADDRESS='support@123flo.com'
export SMTP_EMAIL_PASSWORD='xxx'
export EMAIL_DOMAIN='123flo.com'
export EMAIL_SERVER='mail.123flo.com'
export REDIS_HOST=''
export REDIS_PORT=


#.net server

export SMTP_EMAIL_FROM='support@flomail.net'
export SMTP_EMAIL_ADDRESS='support@flomail.net'
export SMTP_EMAIL_PASSWORD='xxx'
export EMAIL_DOMAIN='flomail.net'
export EMAIL_SERVER='mail.flomail.net'
export REDIS_HOST=''
export REDIS_PORT=

#reload env
# source '/etc/profile.d/flo_env.sh'
