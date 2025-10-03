const config = {
    tableName: 'sort_objects',
    timestamps: false

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
            obj_id: {
                type: DataTypes.STRING,
                required: true
            },
            obj_type: {
                type: DataTypes.STRING,
                required: true
            },
            order_number: {
                type: DataTypes.DECIMAL,
                required: true
            },

            created_date: DataTypes.DOUBLE(13, 3),
            updated_date: DataTypes.DOUBLE(13, 3)

        }, config);

        return Todos;
    }
};

module.exports = Model;
