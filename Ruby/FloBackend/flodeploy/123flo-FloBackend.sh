#!/bin/bash

##//////////////////////////////////////////////////##
##                                                  ##
##   DEPLOY FLOBACKEND - SYNC                       ##
##   https://github.com/LeftCoastLogic/FloBackend   ##
##   UPDATED: 2 May 2019 - NL                       ##
##                                                  ##
##//////////////////////////////////////////////////##

## DEFINE PARAMETERS
FLOAPP_DIR="/var/www/FloApp/FloBackend"
HTTP_HOST_NAME="https://123flo.com:8056"
FLOL_CALDAV_SERVER_URL="http://123flo.com:8058/calendarserver.php/calendars/"
HTTP_HOST_NAME_BG="http://123flo.com:8057/images/"
HTTP_HOST_NAME_FOR_BETA="http://flo.floware.com"
FLOL_CARDDAV_SERVER_URL="http://123flo.com:8058/addressbookserver.php/addressbooks/"
IMAP_FOLDER_PATH="/var/mail/vhosts/123flo.com/"
API_FROM_EMAIL_SUPPORT="support@123flo.com"
UPLOAD_FILE_PATH="/home/data/"
PUSH_NOTI_LIB_PATH="${FLOAPP_DIR}/lib/"
PUSH_NOTI_PEM_FILE="${FLOAPP_DIR}/pem/"

source deploy_confirm.sh
#/////////////////////////////////////////#
#              MAIN TASK                  #
#/////////////////////////////////////////#
echo "1- go to /tmp" && cd /tmp

## 2.1 SET GIT REPOSITORY
if [ -d /tmp/FloBackend ]; then
    cd /tmp/FloBackend
    echo "2- git pull git@github.com:LeftCoastLogic/FloBackend.git" && git pull
else
    echo "2- git clone git@github.com:LeftCoastLogic/FloBackend.git --branch flodev"
    git clone git@github.com:LeftCoastLogic/FloBackend.git FloBackend --branch flodev
fi

## 2.2 GET LATEST STATUS OF GITHUB
echo -e "$(date -R) - $(hostname): \nLast $(git log -1) \n\n\n$(cat ${FLOAPP_DIR}/public/deployed.txt)" > ${FLOAPP_DIR}/public/deployed.txt

## 3. BUNDLE INSTALL
echo -e "\n3- bundle install for FloBackend"
cd /tmp/FloBackend && echo "Where am I? --> here: $(pwd)"
echo "bundle install" && bundle install

## 4. COPY/RSYNC SOURCE FROM /tmp/FloBackend TO FLOAPP_DIR
echo -e "\n4- copy built source to ${FLOAPP_DIR}"
[[ ! -d ${FLOAPP_DIR} ]] && mkdir -p ${FLOAPP_DIR}/
rsync -avzh /tmp/FloBackend/ ${FLOAPP_DIR}/ --exclude "log" --exclude "tmp"


## 5. SET DATABASE.YML, CONFIG_PATH.RB, UPLOAD_PATH.RB
echo -e "\n5- go to ${FLOAPP_DIR}, then sed and replace:" 
[[ ! -d ${FLOAPP_DIR} ]] && echo -e "...Not found ${FLOAPP_DIR}\n\nGoodbye now..!!!\n" && exit 1 || cd ${FLOAPP_DIR}

## 5.1 UPDATE DATABASE.YML CONFIGURATION
echo -e "...${FLOAPP_DIR}/config/database.yml"
sed -i "s/database: flowdata/database: ${MYSQL_DATABASE}/g" config/database.yml
sed -i "s/host: <%= ENV\['MYSQL_HOST'\] %>/host: ${MYSQL_HOST}/g" config/database.yml
sed -i "s/username: <%= ENV\['MYSQL_USERNAME'\] %>/username: ${MYSQL_USERNAME}/g" config/database.yml
sed -i "s/password: <%= ENV\['MYSQL_PASSWORD'\] %>/password: ${MYSQL_PASSWORD}/g" config/database.yml

## 5.2 UPDATE CONFIG_PATH.RB CONFIGURATION
echo "...${FLOAPP_DIR}/config/initializers/config_path.rb"
sed -i "/^HTTP_HOST_NAME =/c\HTTP_HOST_NAME = \"${HTTP_HOST_NAME}\"" config/initializers/config_path.rb
sed -i "/^FLOL_CALDAV_SERVER_URL =/c\FLOL_CALDAV_SERVER_URL = \"${FLOL_CALDAV_SERVER_URL}\"" config/initializers/config_path.rb
sed -i "/^HTTP_HOST_NAME_BG =/c\HTTP_HOST_NAME_BG = \"${HTTP_HOST_NAME_BG}\"" config/initializers/config_path.rb
sed -i "/^FLOL_CARDDAV_SERVER_URL =/c\FLOL_CARDDAV_SERVER_URL = \"${FLOL_CARDDAV_SERVER_URL}\"" config/initializers/config_path.rb
sed -i "/^IMAP_FOLDER_PATH =/c\IMAP_FOLDER_PATH = \"${IMAP_FOLDER_PATH}\"" config/initializers/config_path.rb
sed -i "/^API_FROM_EMAIL_SUPPORT =/c\API_FROM_EMAIL_SUPPORT = \"${API_FROM_EMAIL_SUPPORT}\"" config/initializers/config_path.rb
sed -i "/^HTTP_HOST_NAME_FOR_BETA =/c\HTTP_HOST_NAME_FOR_BETA = \"${HTTP_HOST_NAME_FOR_BETA}\"" config/initializers/config_path.rb
sed -i "/^PUSH_NOTI_LIB_PATH =/c\PUSH_NOTI_LIB_PATH = \"${PUSH_NOTI_LIB_PATH}\"" config/initializers/config_path.rb
sed -i "/^PUSH_NOTI_PEM_FILE =/c\PUSH_NOTI_PEM_FILE = \"${PUSH_NOTI_PEM_FILE}\"" config/initializers/config_path.rb

## 5.3 UPDATE UPLOAD_PATH.RB CONFIGURATION
echo "...${FLOAPP_DIR}/config/initializers/upload_path.rb"
sed -i "/^UPLOAD_FILE_PATH =/c\UPLOAD_FILE_PATH = \"${UPLOAD_FILE_PATH}\"" config/initializers/upload_path.rb

## 5.4 CHECK /home/data and create if not existing
[[ ! -d ${UPLOAD_FILE_PATH} ]] && echo "Create ${UPLOAD_FILE_PATH}" && mkdir -p ${UPLOAD_FILE_PATH}

## 6. RESTART APACHE2 SERVICE
echo -e "\n6- restart apache2 service" && sudo service apache2 restart
echo "---> done!"
echo "---> visit FLOL: ${HTTP_HOST_NAME} "
echo "---> visit Flo Admin: https://admin.floware.ml/ "
echo "---> checkout git log deployed: https://sync.floware.ml/deployed.txt "
echo "---> run console test: cd ${FLOAPP_DIR} && RAILS_ENV=production rails s "

echo -e "\n...End of task!!!"
cd
rm -rf /tmp/FloBackend