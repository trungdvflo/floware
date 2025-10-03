/* eslint-disable new-cap */
const graylog2 = require('graylog2');
const _ = require('lodash');

const logger = new graylog2.graylog({
    servers: [
        { host: process.env.LOG_HOST, port: process.env.LOG_PORT }
    ],
    hostname: 'FloPushNotification', 
    facility: 'Queue_Workers',
    bufferSize: 5000
});

const Graylogs = {
    Filter: (dataFilter) => {
        const dataAfterFilter = dataFilter;
    
        const accessToken = _.get(dataFilter, 'accessToken', false);
        if (accessToken !== false) { 
            dataAfterFilter.accessToken = 'accessToken';
        }
        
        const accessTokenObj = _.get(dataFilter, 'messageObj.accessToken', false);
        if (accessTokenObj !== false) { 
            dataAfterFilter.messageObj.accessToken = 'accessToken';
        }
            
        const refreshToken = _.get(dataFilter, 'refreshToken', false);
        if (refreshToken !== false) { 
            dataAfterFilter.refresh_token = 'refreshToken'; 
        }

        const user = _.get(dataFilter, 'message.user', false);
        if (user !== false) { 
            dataAfterFilter.message.user = dataFilter.message.user.username; 
        }
        
        const userId = _.get(dataFilter, 'messageObj.userId', false);
        if (userId !== false) { 
            dataAfterFilter.messageObj.userId = 'userId'; 
        }
        
        const accessTokenWatch = _.get(dataFilter, 'messageObj.accessToken.access_token', false);
        if (accessTokenWatch !== false) { 
            dataAfterFilter.messageObj.accessToken.access_token = 'access_token'; 
        }
        
        const refreshTokenWatch = _.get(dataFilter, 'messageObj.accessToken.refresh_token', false);
        if (refreshTokenWatch !== false) { 
            dataAfterFilter.messageObj.accessToken.refresh_token = 'refresh_token'; 
        }
    
        return dataAfterFilter;
    },
    SendLog: (functions, messages) => {
        const messagesAfterFilter = Graylogs.Filter(messages);
        logger.log({
            functions,
            messagesAfterFilter
        });
        return true;
    },
    SendLogPushChange: (functions, messages) => {
        const messagesAfterFilter = Graylogs.Filter(messages);
        const module = 'PushChange';
        if(typeof messages == 'string') {
            const messagesAfterFilterString = Graylogs.Filter(messages);
            logger.log({
                module,
                functions,
                messagesAfterFilterString
            });
        } else {
            logger.log({
                module,
                functions,
                messagesAfterFilter
            });
        }
        return true;
    }
};

module.exports = Graylogs;

