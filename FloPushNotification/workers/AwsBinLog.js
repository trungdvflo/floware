/* eslint-disable no-console */
const { Consumer } = require('sqs-consumer');
const ReportCachedUsers = require('./supports/utilities/ReportCachedUsers');
const ApiLastModified = require('./supports/utilities/ApiLastModified');
const PushChange = require('./supports/utilities/PushChange');

const AwsSystemParameterStore = require('../system/AwsSystemParameterStore');

(async () => {
    try {
        await AwsSystemParameterStore.Init();

        // Start Worker
        console.log('** Start worker of AWS BinLog MySQL... ');

        const Graylog = require('./supports/utilities/GrayLog');
        const Model = require('./supports/model');
        const queueName = process.env.MYSQL_BINLOG_EVENT_QUEUE;
        console.log(queueName);
        const { GetDataByType, GetTable } = require('./supports/utilities/FilterDataType');
        const app = Consumer.create({
            queueUrl: queueName,
            handleMessage: async (message) => {
                let messageObj;
                try {
                    messageObj = JSON.parse(message.Body);
                    // console.log(messageObj);
                } catch (error) {
                    return true;
                }
                messageObj.map((key) => {
                    switch (key.function) {
                        case 'report_cached_users':
                            ReportCachedUsers.CollectionData(
                                Model,
                                GetTable(key.data),
                                GetDataByType(key.data),
                                Graylog
                            );
                            break;
                        case 'api_last_modified':
                            console.log('updated api_last_modified');
                            ApiLastModified.SaveData(
                                Model,
                                GetTable(key.data),
                                GetDataByType(key.data),
                                key.data.timeReadLog,
                                Graylog
                            );
                            // apiLastModified = await ApiLastModified.SaveData(
                            //     Model,
                            //     GetTable(key.data),
                            //     GetDataByType(key.data),
                            //     key.data.timestamp,
                            //     Graylog
                            // );
                            // console.log(`ApiLastModified ${ApiLastModified}`);
                            break;
                        case 'push_change':
                            PushChange.SaveData(
                                Model,
                                GetTable(key.data),
                                GetDataByType(key.data),
                                key.data.timestamp,
                                Graylog
                            );
                            break;
                        default:
                            break;
                    }
                    return true;
                });
                return true;
            }
        });

        app.on('error', (err) => {
            console.error(err.message);
        });

        app.on('processing_error', (err) => {
            console.error(err.message);
        });

        app.start();
    } catch (error) {
        console.log(error);
    }
})();
