const mappingTableToApiName = [
    { apiName: 'users', tableName: 'users' },
    { apiName: 'settings', tableName: 'settings' },
    { apiName: 'setaccounts', tableName: 'set_accounts' },
    { apiName: 'projects', tableName: 'projects' },
    { apiName: 'kanbans', tableName: 'kanbans' },
    { apiName: 'canvas', tableName: 'canvas_detail' },
    { apiName: 'files', tableName: 'files' },
    { apiName: 'cloud_storages', tableName: 'cloud_storages' },
    { apiName: 'platform_settings', tableName: 'platform_settings' },
    { apiName: 'urls', tableName: 'urls' },
    { apiName: 'recent_objects', tableName: 'recent_objects' },
    { apiName: 'histories', tableName: 'history' },
    { apiName: 'objorder', tableName: 'sort_objects' },
    { apiName: 'links', tableName: 'links' },
    { apiName: 'tracking', tableName: 'tracking' },
    { apiName: 'trash', tableName: 'trash' },
    { apiName: 'delitems', tableName: 'deleted_items' },
    { apiName: 'devicetoken', tableName: 'device_token' },
    { apiName: 'subscription', tableName: 'subscription_purchase' },
    { apiName: 'suggested_collections', tableName: 'suggested_collections' }
];

const ApiLastModified = {
    SaveData: async (Model, table, data, binlogTimestamp, Graylog) => {
        const userIdColumn = table === 'users' ? 'id' : 'user_id';
        const userId = data[0][userIdColumn];
        const { apiName } = mappingTableToApiName.find(({ tableName }) => tableName === table);
        const now = Date.now() / 1000;
        const timeList = [];
        data.map((item) => {
            if (item.created_date) timeList.push(item.created_date);
            if (item.updated_date) timeList.push(item.updated_date);
        });
        let timestampModified = Math.max(...timeList);
        if (timestampModified <= 1) timestampModified = binlogTimestamp / 1000;

        const existed = await Model.api_last_modified.findOne({
            where: {
                user_id: userId,
                api_name: apiName
            },
            raw: true
        });

        if (!existed) {
            await Model.api_last_modified.create({
                user_id: userId,
                api_name: apiName,
                api_last_modified: timestampModified,
                created_date: now,
                updated_date: now
            });
            return;
        }

        if (existed.api_last_modified < timestampModified) {
            await Model.api_last_modified.update(
                {
                    api_last_modified: timestampModified,
                    updated_date: now
                },
                {
                    where: { id: existed.id }
                }
            );
        }
    }
};

module.exports = ApiLastModified;
