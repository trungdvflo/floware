/* eslint-disable no-buffer-constructor */
/* eslint-disable no-console */
const Async = require('async');
const _ = require('lodash');
const isUrl = require('is-url');
const { Op } = require('sequelize');
const { Buffer } = require('buffer');
const Mkdirp = require('mkdirp');
const vCard = require('vcard-parser');
const { v4: uuidv4 } = require('uuid');
const MD5 = require('md5');
const Fse = require('fs-extra');
const Files = require('./supports/utilities/Files');
const UploadContactAvatar = require('./supports/utilities/UploadContactAvatar');
const AwsSystemParameterStore = require('../system/AwsSystemParameterStore');

const Delay = async (delay) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, delay);
    });
};

async function Base64WriteFile(photo, card, userInfo, appSabre, AppsConstant, Utils, S3) {
    try {                
        const photoValue = _.get(photo, '0.value', false);    
        
        const buf = Buffer.from(photoValue, 'base64');    
        const md5Email = MD5(userInfo.email);
        const localPath = `${process.env.PATH_UPLOAD}/${AppsConstant.CONTACT_AVATAR_PATH}/${md5Email}/${card.addressbookid}`;
        await Mkdirp.sync(localPath);
        const photoMetaType = 'jpg';
        const filename = `${card.uri}.${photoMetaType}`;
        const filePath = `${localPath}/${card.uri}.${photoMetaType}`;        
        const writeFile = await Files.WriteFileBase64(filePath, buf);                
        if (writeFile !== true) {
            return { code: 0 };
        }

        const uploadInfo = {
            localPath,
            filePath,
            filename,
            m: md5Email,
            ad: card.addressbookid,
            u: card.uri
        };
                
        const uploadS3 = await UploadContactAvatar(uploadInfo, S3);                
        if (uploadS3.code === 1) {
            return {
                code: 1,
                uploadS3,
                card
            };
        }
        return { code: 0 };
    } catch (error) {
        throw error;
    }
}
         
async function UploadContactAvatarToS3(data, userInfo, appSabre, AppsConstant, Utils, S3) {
    return new Promise(async (resolve) => {
        const card = _.clone(data);
        const carddata = vCard.parse(data.carddata);
        const photo = _.get(carddata, 'photo', false);
        const photoValue = _.get(photo, '0.value', false);    
            
        if (_.isEmpty(photoValue) === true) {
            resolve({
                code: 0,
                card
            }); 
        } else if (isUrl(photoValue) === false) {            
            const uploadS3 = await Base64WriteFile(photo, card, userInfo, appSabre, AppsConstant, Utils, S3);   
            if (uploadS3.code === 1) {
                const md5Email = MD5(userInfo.email);
                const url = Utils.GenerateContactAvatarUrl(appSabre, md5Email, card.addressbookid, card.uri);
                
                carddata.photo[0].value = url;
                carddata.photo[0].meta = { type: ['image/jpeg'], value: ['URI'] };                            
                card.carddata = vCard.generate(carddata);                
                resolve({
                    ...uploadS3,
                    card
                });
            } else {
                resolve({
                    code: 0,
                    card
                }); 
            }
        } else {
            resolve({
                code: 0,
                card
            }); 
        }
    });
}

(async () => {
    try {
        await AwsSystemParameterStore.Init();
        console.log('** Start Convert Avatar Contact');
        const model = require('./supports/model');
        const AppConstant = require('../projects/default/constants/AppsConstant');
        const Utils = require('../projects/default/utilities/Utils');
        const S3 = require('./supports/S3_DAV');
        const appSabre = await model.app_register.findOne({ 
            where: { app_name: 'SabreDav' },
            raw: true
        });

        const q = Async.queue(async (card, cb) => {
            console.log('Queue start', card.id, '--'); 
            if (_.isEmpty(card) === false) {
                const principaluri = _.get(card, 'addressbooks.principaluri', '');                                                
                if (_.isEmpty(principaluri) === false) {
                    const email = principaluri.split('principals/').slice(-1)[0];
                    const userInfo = await model.users.findOne({
                        attributes: ['id', 'email'],
                        where: {
                            email
                        },
                        raw: true
                    });
                    if (_.isEmpty(userInfo) === false) {
                        const file = await UploadContactAvatarToS3(card, userInfo, appSabre, AppConstant, Utils, S3);
                        if (file.code === 1) {
                            const baseEtag = uuidv4();
                            await model.cards.update({ 
                                carddata: file.card.carddata,
                                size: file.card.carddata.length,
                                etag: MD5(baseEtag),
                                lastmodified: Utils.Timestamp()
                            }, { where: { id: file.card.id } });
                            console.log('OK!');
                        }
                    }
                }
            }

            const convertContactAvatarFilename = `${process.env.PATH_UPLOAD}/convertContactAvatar.json`;
            await Files.WriteFile(convertContactAvatarFilename, JSON.stringify({
                card_id: card.id,
                created_date: Utils.Timestamp()
            }));
            await Delay(200);
            cb();
        }, 1);

        q.drain(async () => {
            console.log('Next queue start after 2s');
            await Fse.emptyDir(`${process.env.PATH_UPLOAD}/${AppConstant.CONTACT_AVATAR_PATH}`);
            await Delay(2000);
            const convertContactAvatarFilename = `${process.env.PATH_UPLOAD}/convertContactAvatar.json`;
            let lastConvertInfo = await Files.ReadFile(convertContactAvatarFilename);
            if (_.isEmpty(lastConvertInfo) === true) {
                const log = {
                    card_id: 0,
                    created_date: Utils.Timestamp()
                };
                await Mkdirp.sync(process.env.PATH_UPLOAD);
                await Files.WriteFile(convertContactAvatarFilename, JSON.stringify(log));
                lastConvertInfo = JSON.stringify(log);
            }

            const lastConvert = JSON.parse(lastConvertInfo);
            const lastConvertId = _.get(lastConvert, 'card_id', 0);
            
            const cards = await model.cards.findAll({
                where: {
                    id: {
                        [Op.gt]: lastConvertId
                    },
                    carddata: {
                        [Op.like]: '%PHOTO;%'
                    }
                },
                include: [{
                    attributes: ['uri', 'principaluri'],
                    model: model.addressbooks,
                    as: 'addressbooks',
                    required: true
                }],
                limit: 100,
                raw: true
            });

            if (_.isEmpty(cards) === false) {
                q.push(cards);
            } else {
                console.log('', '-- Empty data, Finish queue -- ');
                process.exit();
            }
        });
        q.push({});
    } catch (error) {   
        throw error;
    }
})();
