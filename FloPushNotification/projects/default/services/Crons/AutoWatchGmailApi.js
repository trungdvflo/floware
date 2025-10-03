/* eslint-disable no-console */
const { CronJob } = require('cron');
const Moment = require('moment');
const CryptoJS = require('crypto-js');
const { Op } = require('sequelize');
// const _ = require('lodash');
const {
    GmailAccesstokensModel, GmailHistorysModel
} = require('../../models/Sequelize/index');

const AppsConstant = require('../../constants/AppsConstant');
const AwsConstant = require('../../../../workers/supports/AwsConstant');
const AwsSqsQueue = require('../Queues/AwsSqsQueue');

setTimeout(() => {
    console.log('[**] Start Crons: Auto Watch Gmail');
}, 1000);
const watch = new CronJob({
    cronTime: '00 00 00 * * *',
    // cronTime: '*/10 * * * * *',
    onTick: async () => {
        const nowDate = Moment().unix();
        const nowDate2 = Moment().add(3, 'days').unix();
        
        console.log('Auto Watch Gmail', nowDate * 1000, nowDate2 * 1000);  

        const checkHistory = await GmailHistorysModel.findAll({
            where: {
                expiration: {
                    [Op.and]: {
                        [Op.gte]: nowDate * 1000,
                        [Op.lte]: nowDate2 * 1000
                    }
                }  
            },
            raw: true
        });
 
        const email = checkHistory.map((i) => {
            return i.gmail;
        });     
         
        const listAC = await GmailAccesstokensModel.findAll({
            where: {
                gmail: email
            },
            raw: true
        });
        const accessTokenOfGmail = [];
        listAC.map((i) => {
            accessTokenOfGmail[`${i.gmail}`] = i;
            return null;
        });
        email.map((i) => {
            if (accessTokenOfGmail[i]) {
                const detailAC = accessTokenOfGmail[i];
                const preSubKey = CryptoJS.AES.decrypt(detailAC.sub_key, AppsConstant.AES_KEY);
                const subKey = preSubKey.toString(CryptoJS.enc.Utf8);

                const preAccessToken = CryptoJS.AES.decrypt(detailAC.access_token, subKey);
                const accessToken = preAccessToken.toString(CryptoJS.enc.Utf8);

                const preRefreshToken = CryptoJS.AES.decrypt(detailAC.refresh_token, subKey);
                const refreshToken = preRefreshToken.toString(CryptoJS.enc.Utf8);

                const objAccessToken = {
                    access_token: accessToken,
                    refresh_token: refreshToken,
                    scope: detailAC.scope,
                    token_type: detailAC.token_type,
                    expiry_date: detailAC.expiry_date
                };  
                AwsSqsQueue(AwsConstant.AUTO_WATCH_GMAIL, {
                    userId: detailAC.user_id,
                    gmail: detailAC.gmail,
                    accessToken: objAccessToken
                });  
            }
            return null;
        });
    }
});
watch.start();

module.exports = watch;
