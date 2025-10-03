
const config = {
    tableName: 'gmail_historys'

};

const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const GmailHistorysModel = sequelize.define(config.tableName, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            gmail: {
                type: DataTypes.STRING
            },
            email_id: {
                type: DataTypes.STRING
            },
            history_id: {
                type: DataTypes.INTEGER
            },
            expiration: {
                type: DataTypes.INTEGER
            },
            watch_date: {
                type: DataTypes.INTEGER
            },
            watch_expired: {
                type: DataTypes.INTEGER
            },
            created_date: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            updated_date: {
                type: DataTypes.INTEGER,
                allowNull: true
            }

        }, config);

        return GmailHistorysModel;
    }
};

module.exports = Model;
