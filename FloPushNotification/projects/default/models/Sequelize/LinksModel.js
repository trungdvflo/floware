
const config = {
    tableName: 'links'

};
const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const Link = sequelize.define(config.tableName, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            source_type: DataTypes.STRING,
            destination_type: DataTypes.STRING,
            user_id: {
                type: DataTypes.INTEGER,
                default: 0
            },
            source_account: {
                type: DataTypes.STRING,
                default: '0'
            },
            destination_account: {
                type: DataTypes.STRING,
                default: '0'
            },
            source_id: DataTypes.STRING,
            destination_id: DataTypes.STRING,
            email: DataTypes.STRING,
            belongto: {
                type: DataTypes.INTEGER,
                require: true,
                default: 1
            },
            source_root_uid: {
                type: DataTypes.STRING,
                require: true
            },
            destination_root_uid: {
                type: DataTypes.STRING,
                require: true
            },
            meta_data: DataTypes.STRING,
            created_date: DataTypes.DOUBLE(13, 3),
            updated_date: DataTypes.DOUBLE(13, 3)
        }, config);
        return Link;
    }
};

module.exports = Model;
