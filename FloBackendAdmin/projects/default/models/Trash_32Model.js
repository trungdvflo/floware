const config = {
    tableName: 'trash_32'

};
const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const Trash32 = sequelize.define(config.tableName, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },

            user_id: {
                type: DataTypes.INTEGER,
                required: true
            },
            obj_type: DataTypes.STRING,
            obj_id: DataTypes.INTEGER,
            trash_time: DataTypes.INTEGER,
            created_date: DataTypes.INTEGER,
            updated_date: DataTypes.INTEGER

        }, config);

        return Trash32;
    }
};

module.exports = Model;

