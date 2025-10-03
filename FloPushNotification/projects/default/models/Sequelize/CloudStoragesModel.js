
const config = {
    tableName: 'cloud_storages'

};
const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const CloudStorages = sequelize.define(config.tableName, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            user_id: {
                type: DataTypes.INTEGER,
                required: true
            },
            real_filename: {
                type: DataTypes.STRING
            },
            ext: {
                type: DataTypes.STRING
            },
            device_uid: {
                type: DataTypes.STRING,
                required: true
            },
            size: {
                type: DataTypes.INTEGER,
                required: true
            },
            upload_status: {
                type: DataTypes.INTEGER,
                required: true
            },
            bookmark_data: {
                type: DataTypes.STRING,
                required: true
            },
            uid_filename: {
                type: DataTypes.STRING,
                required: true
            },
            created_date: DataTypes.DOUBLE(13, 3),
            updated_date: DataTypes.DOUBLE(13, 3)

        }, config);
        return CloudStorages;
    }
};

module.exports = Model;
