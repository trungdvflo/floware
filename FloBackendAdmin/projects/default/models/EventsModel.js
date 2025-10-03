
const config = {
    tableName: 'events'

};

const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const Events = sequelize.define(config.tableName, {
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
            uri: {
                type: DataTypes.STRING
            },
            calender_uri: {
                type: DataTypes.STRING
            },
            recur_id: {
                type: DataTypes.STRING
            },
            ex_date: {
                type: DataTypes.STRING
            }

        }, config);

        return Events;
    }
};

module.exports = Model;
