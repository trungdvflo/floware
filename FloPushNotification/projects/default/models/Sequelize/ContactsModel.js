/**
 * Will be remove
 */
const config = {
    tableName: 'contacts'

};

const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const Contacts = sequelize.define(config.tableName, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            user_id: {
                type: DataTypes.INTEGER,
                required: true
            },
            set_account_id: DataTypes.INTEGER,
            uid: DataTypes.STRING,
            uri: DataTypes.STRING,
            addressbook_uri: DataTypes.STRING,
            root_uid: DataTypes.STRING

        }, config);

        return Contacts;
    }
};

module.exports = Model;
