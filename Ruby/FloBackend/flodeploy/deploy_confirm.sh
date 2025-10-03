#!/bin/bash
# RED='\033[0;31m'
# NC='\033[0m' # No Color

## CHECKING & SOURCE RVM
if [ -f /etc/profile.d/rvm.sh ]; then source /etc/profile.d/rvm.sh && echo "...source /etc/profile.d/rvm.sh" ; fi
## CHECKING FLO ENVIRONMENT
echo -e "\nChecking:"
#echo "gem install bundler" && gem install bundler
echo "...Login Shell User : $(whoami)"
echo "...RVM Version      : $(rvm -v 2>/dev/null || echo 'Not found')"
echo "...Node Version     : $(node -v 2>/dev/null || echo 'Not found')"
echo "...Ruby Version     : $(ruby -v 2>/dev/null || echo 'Not found')"
echo "...Bundler Version  : $(bundle -v 2>/dev/null || echo 'Not found')"
echo "...Passenger Version: $(passenger -v 2>/dev/null || echo 'Not found')"
[[ -d ${FLOAPP_DIR} ]] && \
echo "...FLOAPP_DIR       : Found ${FLOAPP_DIR}" || \
echo "...FLOAPP_DIR       : Not found ${FLOAPP_DIR}"
## CHECKING FLO_ENV.SH
if [ ! -f /etc/profile.d/flo_env.sh ]; then
    echo "...FLO_ENV          : Not found /etc/profile.d/flo_env.sh"
else
    echo "...FLO_ENV          : Found /etc/profile.d/flo_env.sh" && source /etc/profile.d/flo_env.sh
fi

##
##  this script to ask user if they're sure and wanted to run this bash script as current log-in user.
##
echo -e "\n"
read -n 1 -p "Do you want to run this bash script as $(whoami)? Yes/[No]: " YES_NO
echo -e "\n"
if [ -z ${YES_NO} ] || [ ${YES_NO} = "No" ] ||  [ ${YES_NO} = "no" ] ||  [ ${YES_NO} = "N" ] ||  [ ${YES_NO} = "n" ]; then
    echo "You select No, then it is going to exit now... "
    sleep 1
    echo -e "\nGood bye now..!!!\n"
    sleep 1
    exit 1
elif [ ${YES_NO} = "Yes" ] ||  [ ${YES_NO} = "yes" ] ||  [ ${YES_NO} = "Y" ] ||  [ ${YES_NO} = "y" ]; then
    echo -e "\nHmmmm, hummm..."
    sleep 2
    echo -e "\nOkey, then it is going to run the bash script now... after 5 seconds"
    sleep 3
    echo -e "\n2 seconds now..."
    sleep 2
    echo -e "\nDeploying...\n"
else
    echo -e "\nWrong input!!!"
    sleep 1
    echo -e "\nGood bye now..!!!\n"
    sleep 1
    exit 1
fi