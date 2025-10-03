import * as AWS from 'aws-sdk';
import { LoggerService } from '../logger/logger.service';
// Set the region we will be using
const AWS_REGION = process.env.AWS_REGION || 'ap-southeast-1';
AWS.config.update({ region: AWS_REGION });

// Create SQS service client
const SQS = new AWS.SQS({ apiVersion: process.env.AWS_API_VERSION });

export class SqsQueue {
    private readonly params: any;
    private readonly logger: LoggerService;
    constructor(queueUrl: string, msg: any, logger: LoggerService) {
        this.logger = logger;
        const message = msg;
        message.date = (new Date()).toISOString();
        this.params = {
            MessageBody: JSON.stringify(message),
            QueueUrl: queueUrl
        };
    }

    send() {
        return new Promise((resolve, reject) => {
            SQS.sendMessage(this.params, (err, data) => {
                if (err && this.logger) {
                    this.logger.error(err);
                    reject(err);
                } else {
                    resolve(true);
                    this.logger.logInfo(`Successfully added message queue ${data.MessageId}`);
                }
            });
        });
    }
}
