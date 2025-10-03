
const config = {
    tableName: 'gmail_accesstokens'

};

const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const GmailAccesstokens = sequelize.define(config.tableName, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            user_id: {
                type: DataTypes.INTEGER,
                required: true
            },
            app_id: {
                type: DataTypes.STRING
            },
            device_token: {
                type: DataTypes.STRING
            },
            gmail: {
                type: DataTypes.STRING
            },
            sub_key: {
                type: DataTypes.STRING
            },
            access_token: {
                type: DataTypes.STRING
            },
            refresh_token: {
                type: DataTypes.STRING
            },
            scope: {
                type: DataTypes.STRING
            },
            token_type: {
                type: DataTypes.STRING
            },
            expiry_date: {
                type: DataTypes.INTEGER
            },
            status: {
                type: DataTypes.STRING
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

        return GmailAccesstokens;
    }
};

module.exports = Model;
