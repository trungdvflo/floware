const { Op } = require('sequelize');
const NodeRSA = require('node-rsa');
const models = require('../models');
const config = require('../config/config').getConfig();
const cryptoUtils = require('../utils/cryptoUtils');

async function inTransaction(work) {
    const t = await models.sequelize.transaction();

    try {
        await work(t);
        return t.commit();
    } catch (err) {
        t.rollback();
        throw err;
    }
}

async function setAuthToken(accountId, token, tokenExpire) {
    const encryptedAccessToken = cryptoUtils.aes256Encrypt(token, config.GOOGLE_TOKEN_AES_KEY, config.GOOGLE_TOKEN_AES_IV);
    return models.Account.update({ auth_token: encryptedAccessToken, token_expire: tokenExpire },
        { where: { id: accountId } });
}

async function getByEmailAddress(userId, emailAddress, accountType) {
    return models.Account.findOne({
        where: {
            user_id: userId,
            account_type: accountType,
            [Op.or]: [{ email_address: emailAddress }, { user_income: emailAddress }]
        }
    });
}

async function getById(userId, accountId) {
    return models.Account.findOne({
        where: {
            user_id: userId,
            id: accountId
        }
    });
}

async function createOtherEmailAccount(userId,
    {
        incomingServer, outgoingServer, fullName, description, address, pass
    }, t) {
    if (!incomingServer) return [null, false];
    const key = new NodeRSA(config.rsa.RSA_PUBLIC_KEY);
    pass = key.encrypt(pass, 'base64').toString();
    const defaults = {
        server_income: incomingServer.host,
        pass_income: pass,
        port_income: incomingServer.port,
        useSSL_income: incomingServer.secure ? 1 : 0,
        auth_type: 0,
        account_type: 3,
        account_sync: JSON.stringify({ Email: 1, Calendar: 0 }),
        full_name: fullName,
        description,
        email_address: address
    };
    if (outgoingServer) {
        defaults.server_smtp = outgoingServer.host;
        defaults.user_smtp = outgoingServer.user;
        defaults.pass_smtp = pass;
        defaults.port_smtp = outgoingServer.port;
        defaults.useSSL_smtp = outgoingServer.secure ? 1 : 0;
    }
    return models.Account.findOrCreate({
        where: {
            user_id: userId,
            user_income: incomingServer.user,
            account_type: 3
        },
        defaults,
        transaction: t
    });
}

async function updateOtherEmailAccount(userId,
    {
        incomingServer, outgoingServer, fullName, description, address, pass
    }, t) {
    if (!incomingServer) return;
    const key = new NodeRSA(config.rsa.RSA_PUBLIC_KEY);
    pass = key.encrypt(pass, 'base64').toString();
    const defaults = {
        server_income: incomingServer.host,
        pass_income: pass,
        port_income: incomingServer.port,
        useSSL_income: incomingServer.secure ? 1 : 0,
        auth_type: 0,
        account_type: 3,
        account_sync: JSON.stringify({ Email: 1, Calendar: 0 }),
        full_name: fullName,
        description,
        email_address: address
    };
    if (outgoingServer) {
        defaults.server_smtp = outgoingServer.host;
        defaults.user_smtp = outgoingServer.user;
        defaults.pass_smtp = pass;
        defaults.port_smtp = outgoingServer.port;
        defaults.useSSL_smtp = outgoingServer.secure ? 1 : 0;
    }
    return models.Account.update(defaults, {
        where: {
            user_id: userId,
            user_income: incomingServer.user,
            account_type: 3
        }
    },
        { transaction: t });
}

async function createOrUpdateGoogleAccount(userId,
    {
        emailAddress, refreshToken, accessToken, fullName, description
    }, t, isUpdateDisplayedAccInfo) {
    const encryptedRefreshToken = cryptoUtils.aes256Encrypt(refreshToken, config.GOOGLE_TOKEN_AES_KEY, config.GOOGLE_TOKEN_AES_IV);
    const encryptedAccessToken = cryptoUtils.aes256Encrypt(accessToken, config.GOOGLE_TOKEN_AES_KEY, config.GOOGLE_TOKEN_AES_IV);
    const values = {
        user_id: userId,
        user_income: emailAddress,
        account_type: 1,
        server_income: 'imap.gmail.com',
        port_income: '993',
        useSSL_income: 1,
        type_income: 0,
        server_smtp: 'smtp.gmail.com',
        user_smtp: emailAddress,
        port_smtp: '465',
        useSSL_smtp: 1,
        auth_type_smtp: 256,
        auth_type: 256,
        server_caldav: 'https://apidata.googleusercontent.com',
        server_path_caldav: `/caldav/v2/${emailAddress}/`,
        port_caldav: '993',
        useSSL_caldav: 1,
        account_sync: JSON.stringify({ Email: 1, Calendar: 1, Contact: 1 }),
        full_name: fullName,
        description,
        email_address: emailAddress,
        auth_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        signature: ''
    };
    const account = await models.Account.findOne({
        where: {
            user_id: userId,
            user_income: emailAddress,
            email_address: emailAddress,
            account_type: 1
        },
        transaction: t
    });
    if (!account) {
        return models.Account.create(values, { transaction: t });
    }
    values.account_sync = JSON.stringify(account.account_sync);
    if (!isUpdateDisplayedAccInfo) {
        values.description = account.description;
        values.full_name = account.full_name;
    }
    return account.update(values, { transaction: t });
}

async function getAccounts(userId) {
    try {
        const accounts = await models.Account.findAll({
            where: {
                user_id: userId
            }
        });
        return accounts.map((a) => {
            return {
                ...a.get({ plain: true }),
                refresh_token: undefined,
                auth_token: undefined,
                auth_key: undefined,
                signature: undefined,
                pass_income: undefined,
                pass_smtp: undefined
            };
        });
    } catch (err) {
        throw err;
    }
}

module.exports = {
    setAuthToken,
    inTransaction,
    getByEmailAddress,
    getById,
    createOtherEmailAccount,
    updateOtherEmailAccount,
    createOrUpdateGoogleAccount,
    getAccounts
};
