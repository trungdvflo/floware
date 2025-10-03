/* eslint-disable no-useless-catch */
const { Queue } = require('bullmq');
const Code = require('../constants/ResponseCodeConstant');
const AwsSqsQueue = require('../services/Queues/AwsSqsQueue');
const AwsConstant = require('../configs/AwsConstant');
const LinkedMailCollectionRabbitMQ = require('../services/Queues/LinkedMailCollectionRabbitMQ');
const DeletedEmailRabbitMQ = require('../services/Queues/DeletedEmailRabbitMQ');
const Server = require('../app').server;
const LogsUtil = require('../utilities/Logs');
const { log } = require('async');

const ReceiveMessage = async (request, h) => {
  try {
    const { payload } = request;
    const logMessage = LogsUtil.Filter(payload);
    Server.log('DoveCot: Receive data', {
      logMessage
    });

    // Send message to Queue
    await AwsSqsQueue(AwsConstant.SQS_URL_DOVECOT_NEW_MAIL, payload);
    return h.response({
      code: Code.REQUEST_SUCCESS,
      data: {
        message: 'Received data'
      }
    }).code(Code.REQUEST_SUCCESS);
  } catch (error) {
    Server.log(['error'], error);
  }
};

const LinkedEmailCollection = async (request, h) => {
  try {
    const { payload } = request;
    const logMessage = LogsUtil.Filter(payload);
    Server.log('DoveCot: Receive LinkedEmailCollection data', {
      logMessage
    });
    // Send message to Queue
    const queue = new Queue(AwsConstant.DOVECOT_LINKED_MAIL_COLLECTION, {
      connection: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
        db: process.env.REDIS_DB,
        password: process.env.REDIS_AUTH,
        tls: process.env.REDIS_TLS ? JSON.parse(process.env.REDIS_TLS) : false
      },
      defaultJobOptions: {
        removeOnComplete: 20,
        removeOnFail: 50
      }
    });

    switch (payload.action) {
      case 62:
        await queue.add(AwsConstant.DOVECOT_LINKED_MAIL_COLLECTION_JOB, {
          username: payload.username,
          action: payload.action,
          uid: {
            uid: payload.uid,
            path: payload.path
          }
        });
        break;
      default:
        await queue.add(AwsConstant.DOVECOT_LINKED_MAIL_COLLECTION_JOB, {
          username: payload.username,
          action: payload.action,
          collection_id: payload.collection_id,
          uid: {
            uid: payload.uid,
            path: payload.path
          }
        });
        break;
    }

    return h.response({
      code: Code.REQUEST_SUCCESS,
      data: {
        message: 'Received LinkedEmailCollection data'
      }
    }).code(Code.REQUEST_SUCCESS);
  } catch (error) {
    Server.log(['error'], error);
  }
};

const LinkedEmailCollectionRabbit = async (request, h) => {
  try {
    const { payload } = request;
    const logMessage = LogsUtil.Filter(payload);
    Server.log('DoveCot: Receive LinkedEmailCollection data', {
      logMessage
    });
    // Send message to Queue
    const linkedMailCollectionRMQ = LinkedMailCollectionRabbitMQ.instance();

    switch (payload.action) {
      case 62:
        await linkedMailCollectionRMQ.addJob(AwsConstant.DOVECOT_LINKED_MAIL_COLLECTION_JOB, {
          username: payload.username,
          action: payload.action,
          uid: {
            uid: payload.uid,
            path: payload.path
          }
        });
        break;
      default:
        await linkedMailCollectionRMQ.addJob(AwsConstant.DOVECOT_LINKED_MAIL_COLLECTION_JOB, {
          username: payload.username,
          action: payload.action,
          collection_id: payload.collection_id,
          uid: {
            uid: payload.uid,
            path: payload.path
          }
        });
        break;
    }

    return h.response({
      code: Code.REQUEST_SUCCESS,
      data: {
        message: 'Received LinkedEmailCollection data'
      }
    }).code(Code.REQUEST_SUCCESS);
  } catch (error) {
    Server.log(['error'], error);
  }
};

const GetReceiveMessage = async (request, h) => {
  try {
    const { query } = request;
    // Send message to Queue
    const logMessage = LogsUtil.Filter(query);
    Server.log('DoveCot: Get Receive Message', {
      logMessage
    });

    await AwsSqsQueue(AwsConstant.SQS_URL_DOVECOT_NEW_MAIL, query);
    return h.response({
      code: Code.REQUEST_SUCCESS,
      data: {
        message: 'Received data'
      }
    }).code(Code.REQUEST_SUCCESS);
  } catch (error) {
    Server.log(['error'], error);
  }
};

const PostDeleteEmail = async (request, h) => {
  try {
    const deletedEmailRMQ = DeletedEmailRabbitMQ.instance();
    const { payload: { email, uid, path } } = request;
    await deletedEmailRMQ.addJob(AwsConstant.DELETE_MAIL_TRIGGER_JOB, {
      email, uid, path
    });
    return h.response({
      code: Code.REQUEST_SUCCESS,
      data: {
        message: 'Received data'
      }
    }).code(Code.REQUEST_SUCCESS);
  } catch (error) {
    console.log(error);
    Server.log(['error'], error);
  }
};

module.exports = {
  ReceiveMessage,
  LinkedEmailCollection,
  LinkedEmailCollectionRabbit,
  GetReceiveMessage,
  PostDeleteEmail
};
