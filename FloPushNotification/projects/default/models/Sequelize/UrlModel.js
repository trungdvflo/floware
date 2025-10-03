
const config = {
    tableName: 'urls'

};
const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const Url = sequelize.define(config.tableName, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            user_id: {
                type: DataTypes.INTEGER,
                default: 0,
                required: true
            },
            url: DataTypes.STRING,
            title: DataTypes.STRING,
            order_number: {
                type: DataTypes.INTEGER,
                default: 0,
                required: true
            },
            order_update_time: {
                type: DataTypes.DOUBLE(13, 3),
                default: 0.000,
                required: true
            },
            created_date: DataTypes.DOUBLE(13, 3),
            updated_date: DataTypes.DOUBLE(13, 3)
        }, config);
        return Url;
    }
};

module.exports = Model;
