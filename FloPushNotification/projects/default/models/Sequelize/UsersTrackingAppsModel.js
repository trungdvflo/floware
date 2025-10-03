const config = {
    tableName: 'users_tracking_apps'
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
                tracking_app_id: {
                    type: DataTypes.INTEGER,
                    default: 0,
                    required: true
                },
                last_used_date: DataTypes.INTEGER,
                created_date: DataTypes.INTEGER,
                updated_date: DataTypes.INTEGER
            },
            config
        );
    }
};

module.exports = Model;
