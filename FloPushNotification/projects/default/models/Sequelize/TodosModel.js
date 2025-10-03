const config = {
    tableName: 'todos'

};
const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const Todos = sequelize.define(config.tableName, {
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
            order_number: {
                type: DataTypes.INTEGER
            },
            order_updated_time: {
                type: DataTypes.INTEGER
            }

        }, config);

        return Todos;
    }
};

module.exports = Model;
