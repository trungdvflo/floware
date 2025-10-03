/* eslint-disable no-useless-catch */
const Futil = require('./Futil');

const InitializeImap = async (req, res, next) => {
    try {
        const { user } = req;        
        const imapConfig = {
            user: user.user_income,
            password: Futil.passFromUser(user),
            host: Futil.getHost(user.server_income),
            port: user.port_income,
            tls: user.useSSL_income,
            tlsOptions: {
                rejectUnauthorized: false
            },
            autotls: 'required'
        };
        
        const imapService = require('../services/ImapService')(imapConfig, user);
        const imap = await imapService.connect();
        req.imap = imap;
        req.imapService = imapService;
        next();
    } catch (err) {
        next(err);
    }
};

const EndImap = async (req, res, next) => {
    try {
        const { imapService } = req;
        if (!imapService) return next('No imap instance');
        await imapService.end();
        return true;
    } catch (err) {
        return false;
    }
};

module.exports = { 
    InitializeImap,
    EndImap
};
