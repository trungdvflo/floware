
const config = {
    tableName: 'config'
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
            group: {
                type: DataTypes.STRING,
                required: true
            },
            key: {
                type: DataTypes.STRING,
                required: true
            },
            value: {
                type: DataTypes.JSON,
                required: true
            },

        }, config);

        return Contacts;
    }
};

module.exports = Model;
