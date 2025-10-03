const config = {
    tableName: 'users_platform_versions'
};
const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        return sequelize.define(
            config.tableName,
            {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                user_id: {
                    type: DataTypes.INTEGER,
                    default: 0,
                    required: true
                },
                app_id: {
                    type: DataTypes.STRING,
                    default: 0,
                    required: true
                },
                device_token: DataTypes.INTEGER,
                platform_release_version_id: DataTypes.INTEGER,
                user_agent: DataTypes.STRING,
                created_date: DataTypes.DOUBLE(13, 3),
                updated_date: DataTypes.DOUBLE(13, 3)
            },
            config
        );
    }
};

module.exports = Model;
