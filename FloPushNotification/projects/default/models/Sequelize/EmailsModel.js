
const config = {
    tableName: 'emails'

};

const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const Emails = sequelize.define(config.tableName, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            user_id: {
                type: DataTypes.INTEGER,
                required: true
            },
            set_account_id: {
                type: DataTypes.INTEGER
            },
            uid: {
                type: DataTypes.STRING
            },
            imap_folder: {
                type: DataTypes.STRING
            },
            subject: {
                type: DataTypes.STRING,
                allowNull: true
            },
            message_id: {
                type: DataTypes.STRING,
                allowNull: true
            },
            from: {
                type: DataTypes.STRING,
                allowNull: true
            },
            to: {
                type: DataTypes.STRING,
                allowNull: true
            },
            cc: {
                type: DataTypes.STRING,
                allowNull: true
            },
            bcc: {
                type: DataTypes.STRING,
                allowNull: true
            },
            snippet: {
                type: DataTypes.STRING,
                allowNull: true
            },
            received_date: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            sent_date: {
                type: DataTypes.INTEGER,
                allowNull: true
            }

        }, config);

        return Emails;
    }
};

module.exports = Model;
