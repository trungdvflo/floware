#123flo.com server
#command to run: bash /home/ubuntu/cong.tran/filename.sh

#################################################
#auth: cong.tran
#step by step to deploy the new code
#1 - pull code from github
#2 - build code FloAdmin
#3 - build code FloOnlineClient - FLOL
#4 - copy code FloOnlineServer to /var/www/...
#5 - copy code DoMailServer to /var/www/...
#6 - copy code FLOL to /var/www/...
#7 - copy code FloAdmin to /var/www/...
#8 - reload apache2 service
#9 - restart DoMailServer service with forever
#10 - done!
#################################################
# set param for email
# export EMAIL_SERVER='123flo.com'
#reload env
# source '/etc/profile.d/flo_env.sh'

# config backup
pFloConfig="/home/ubuntu/cong.tran/FloWare/FloConfig"

#define path of code which get from git
#root of code
pFloProd="/home/ubuntu/cong.tran/FloWare/FloBackend/FloBackend"
#admin code
# pFloAdmin=${pFloProd}/FloAdmin
#flol client code
# pFloClient=${pFloProd}/FloOnlineClient
#ruby code
pFloRubyServer=${pFloProd}
# #nodejs code
# pDoMailServer=${pFloProd}/DoMailServer

#################################################
# #define path of code in /var/www
# 
pFloRootDes="/var/www/FloOnline2018Nov"
# # #admin
# pFloAdminDes=${pFloRootDes}/FloAdmin
# # #flol client
# pFloClientDes=${pFloRootDes}/FloOnlineClient/wwwTest
# # #ruby
pFloRubyDes=${pFloRootDes}/FloOnlineServer/latestVersion
# # #domail - nodejs
# # /var/www/FloOnline2018Nov/DoMailServer/v0.9
# pFloDoMailDes=${pFloRootDes}/DoMailServer/v0.9

#################################################
#1 - pull code from github
#go to code folder
echo "1 - pull code from github..."
cd ${pFloProd}
git pull

#Note: use checkout if the code have some changes from github
#git checkout -- "filename"

# #################################################
# #2 - build code FloAdmin
# echo "2 - build code FloAdmin..."
# cd  ${pFloAdmin}
# sudo grunt buildquick

# #################################################
# #3 - build code FloOnlineClient - FLOL
# #build code production environment
# echo "3 - build code FloOnlineClient - FLOL..."
# cd  ${pFloClient}
# sudo grunt buildquick


#################################################
#4 - copy code FloOnlineServer to /var/www/...
echo "4 - copy code FloOnlineServer to ${pFloRubyDes}/..."
# #Note: copy and print file destination
# #rsync -azhR : rsync directory and print to console
# #rsync -azh : rsync file and dont print to console

#copy and no print file
# rsync -azh ${pFloRubyServer}/app/ ${pFloRubyDes}/app/
# rsync -azh ${pFloRubyServer}/lib/ ${pFloRubyDes}/lib/
# rsync -azh ${pFloRubyServer}/spec/ ${pFloRubyDes}/spec/
# rsync -azh ${pFloRubyServer}/config/routes.rb ${pFloRubyDes}/config/routes.rb
# rsync -azh ${pFloRubyServer}/config/initializers/active_support_encoding.rb ${pFloRubyDes}/config/initializers/active_support_encoding.rb
# rsync -azh ${pFloRubyServer}/config/initializers/admin.rb ${pFloRubyDes}/config/initializers/admin.rb
# rsync -azh ${pFloRubyServer}/config/initializers/constants.rb ${pFloRubyDes}/config/initializers/constants.rb
# rsync -azh ${pFloRubyServer}/config/initializers/error_codes.rb ${pFloRubyDes}/config/initializers/error_codes.rb
# rsync -azh ${pFloRubyServer}/config/initializers/messages.rb ${pFloRubyDes}/config/initializers/messages.rb
# rsync -azh ${pFloRubyServer}/config/routes/ ${pFloRubyDes}/config/routes/
# rsync -azh ${pFloRubyServer}/config/application.rb ${pFloRubyDes}/config/application.rb
# rsync -azh ${pFloRubyServer}/config/environment.rb ${pFloRubyDes}/config/environment.rb

rsync -azh ${pFloRubyServer}/ ${pFloRubyDes}/
# replace the config 
rsync -azh ${pFloConfig}/FloOnlineServer/config/initializers/config_path.rb ${pFloRubyDes}/config/initializers/config_path.rb
rsync -azh ${pFloConfig}/FloOnlineServer/config/initializers/upload_path.rb ${pFloRubyDes}/config/initializers/upload_path.rb
rsync -azh ${pFloConfig}/FloOnlineServer/config/environments/production.rb ${pFloRubyDes}/config/environments/production.rb
rsync -azh ${pFloConfig}/FloOnlineServer/config/database.yml ${pFloRubyDes}/config/database.yml
rsync -azh ${pFloConfig}/FloOnlineServer/tmp/ ${pFloRubyDes}/tmp/


#################################################
#5 - copy code DoMailServer to /var/www/...
# echo "5 - copy code DoMailServer to ${pFloDoMailDes}/..."
# rsync -azh ${pDoMailServer}/controllers/ ${pFloDoMailDes}/controllers/
# rsync -azh ${pDoMailServer}/libs/ ${pFloDoMailDes}/libs/
# rsync -azh ${pDoMailServer}/routes/ ${pFloDoMailDes}/routes/
# rsync -azh ${pDoMailServer}/utils/ ${pFloDoMailDes}/utils/
# rsync -azh ${pDoMailServer}/node_modules/ ${pFloDoMailDes}/node_modules/
# rsync -azh ${pDoMailServer}/package.json ${pFloDoMailDes}/package.json
# rsync -azh ${pDoMailServer}/config/express.js ${pFloDoMailDes}/config/express.js

# #################################################
# #6 - copy code FLOL to /var/www/...
# echo "6 - copy code FLOL to ${pFloClientDes}/..."
# rsync -azh ${pFloClient}/www/css/ ${pFloClientDes}/css/ --delete-after
# rsync -azh ${pFloClient}/www/js/ ${pFloClientDes}/js/  --delete-after
# #copy pathConfig.js again
# rsync -azh ${pFloClientDes}/pathConfig/pathConfig.js ${pFloClientDes}/js/pathConfig.js

# rsync -azh ${pFloClient}/www/partials/ ${pFloClientDes}/partials/
# rsync -azh ${pFloClient}/www/template/ ${pFloClientDes}/template/
# rsync -azh ${pFloClient}/www/font-awesome/ ${pFloClientDes}/font-awesome/
# rsync -azh ${pFloClient}/www/images/ ${pFloClientDes}/images/
# # rsync -azh ${pFloClient}/www/libs/ ${pFloClientDes}/libs/
# rsync -azh ${pFloClient}/www/static/ ${pFloClientDes}/static/
# rsync -azh ${pFloClient}/www/index.html ${pFloClientDes}/index.html
# # rsync -azh ${pFloClient}/www/login_page.html ${pFloClientDes}/login_page.html


# #################################################
# #7 - copy code FloAdmin to /var/www/...
# echo "7 - copy code FloAdmin to ${pFloAdminDes}/..."
# rsync -azh ${pFloAdmin}/www/css/ ${pFloAdminDes}/css/ --delete-after
# rsync -azh ${pFloAdmin}/www/images/ ${pFloAdminDes}/images/
# rsync -azh ${pFloAdmin}/www/libs/ ${pFloAdminDes}/libs/
# rsync -azh ${pFloAdmin}/www/js/ ${pFloAdminDes}/js/ --delete-after
# #copy pathConfig.js again
# rsync -azh ${pFloAdminDes}/pathConfig/pathConfig.js ${pFloAdminDes}/js/pathConfig.js

# rsync -azh ${pFloAdmin}/www/partials/ ${pFloAdminDes}/partials/
# rsync -azh ${pFloAdmin}/www/template/ ${pFloAdminDes}/template/
# rsync -azh ${pFloAdmin}/www/index.html ${pFloAdminDes}/index.html

#################################################
echo "7.1 - cd to destination to bundle install..."
cd ${pFloRubyDes}
bundle install

echo "Execute SideKiq ..."
bundle exec sidekiq -d -L log/sidekiq.log -e production

#8 - reload apache2 service
echo "8 - reload apache2 service ..."
sudo service apache2 reload


#################################################
#9 - restart DoMailServer service with forever
# echo "9 - restart DoMailServer service with forever..."
# cd ${pFloDoMailDes}/
# forever stop app.js
# NODE_ENV=production forever start app.js

#################################################
echo "---> done! <----"
echo "---> visit FLOL: http://123flo.com:8056 <----"
echo "---> visit Flo Admin: http://123flo.com:8055 <----"

#################################################
# log deploy code
cd ${pFloRubyDes}/public
echo "$(date -R) - $(hostname) : Last commit $(git rev-parse HEAD) \n<br/>" >> deployed.html
