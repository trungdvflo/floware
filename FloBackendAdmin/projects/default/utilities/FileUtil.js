/* eslint-disable no-async-promise-executor */
/* eslint-disable no-param-reassign */
/* eslint-disable no-useless-catch */
const pathUtil = require('path');
const { PATH_UPLOAD } = require('../constants/AppsConstant');

function GetFileLocation(email, userId, location) {
    let identity = [];    
    identity.push(`${userId}`);
    if (email) {
        identity = identity
            .concat(location)
            .concat(email.replace('@', '_'));
    } else {
        identity = identity.concat(location);
    }
    const basePath = PATH_UPLOAD;
    return pathUtil.join.apply(null, [basePath].concat(identity));
}

module.exports = {
    GetFileLocation
};
