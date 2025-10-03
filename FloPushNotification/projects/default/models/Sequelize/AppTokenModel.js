
const config = {
    tableName: 'app_token'

};

const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const AppToken = sequelize.define(config.tableName, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            app_pregId: {
                type: DataTypes.STRING,
                field: 'app_pregId'
            },
            key_api: DataTypes.STRING,
            user_id: DataTypes.INTEGER,
            token: DataTypes.STRING,
            email: DataTypes.STRING,
            time_expire: DataTypes.DOUBLE(13, 3),
            created_time: DataTypes.DOUBLE(13, 3)

        }, config);

        return AppToken;
    }
};

module.exports = Model;
