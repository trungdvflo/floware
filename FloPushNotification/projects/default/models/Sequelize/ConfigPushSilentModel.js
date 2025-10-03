const config = {
    tableName: 'config_push_silent'

};

const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const configPushSilent = sequelize.define(config.tableName, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            show_sound: DataTypes.STRING,
            show_alert: DataTypes.STRING,
            has_alert: DataTypes.INTEGER,
            interval_stop_push: DataTypes.INTEGER

        }, config);

        return configPushSilent;
    }
};

module.exports = Model;
