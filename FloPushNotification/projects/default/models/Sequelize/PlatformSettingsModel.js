
const config = {
    tableName: 'platform_settings'

};
const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const PlatformSettings = sequelize.define(config.tableName, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            user_id: {
                type: DataTypes.INTEGER,
                required: true
            },
            app_reg_id: {
                type: DataTypes.INTEGER,
                required: true
            },
            app_version: {
                type: DataTypes.STRING,
                required: true
            },
            data_setting: {
                type: DataTypes.STRING,
                required: false
            },
            created_date: DataTypes.DOUBLE(13, 3),
            updated_date: DataTypes.DOUBLE(13, 3)

        }, config);
        // 07/01/2020
        // Change formart FLOAT >> DOUBLE
        return PlatformSettings;
    }
};

module.exports = Model;
