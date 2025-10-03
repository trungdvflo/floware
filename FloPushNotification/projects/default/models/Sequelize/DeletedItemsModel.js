
const config = {
    tableName: 'deleted_items'
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
            item_type: DataTypes.STRING,
            item_id: DataTypes.STRING,
            is_recovery: DataTypes.INTEGER,
            created_date: DataTypes.DOUBLE(13, 3),
            updated_date: DataTypes.DOUBLE(13, 3)

        }, config);

        return Contacts;
    }
};

module.exports = Model;
