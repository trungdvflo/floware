const config = {
    tableName: 'obj_order'

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
            source_account: {
                type: DataTypes.INTEGER
            },
            obj_id: {
                type: DataTypes.STRING
            },
            obj_type: {
                type: DataTypes.STRING
            },
            order_number: {
                type: DataTypes.DECIMAL
            },

            created_date: DataTypes.DOUBLE(13, 3),
            updated_date: DataTypes.DOUBLE(13, 3)

        }, config);

        return Todos;
    }
};

module.exports = Model;
