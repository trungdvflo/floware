const _ = require('lodash');
const { Queues } = require('../../../system/Queue');

async function SendReportCachedUser(request) {
  const userInfo = _.get(request, 'auth.credentials', false);

  if (request.method !== 'get' && userInfo !== null) {
    await Queues.addQueueReportCachedUser({ userId: userInfo.user_id });
  }
}

module.exports = {
  SendReportCachedUser
};
