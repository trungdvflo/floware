
const config = {
    tableName: 'contact_avatar'

};
const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const Admin = sequelize.define(config.tableName, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            user_id: {
                type: DataTypes.INTEGER,
                required: true
            },
            file_name: DataTypes.STRING,
            file_ext: DataTypes.STRING,
            root_uid: DataTypes.STRING,
            obj_uri: DataTypes.STRING,
            size: DataTypes.INTEGER,
            created_date: DataTypes.DOUBLE(13, 3),
            updated_date: DataTypes.DOUBLE(13, 3)
        }, config);
        return Admin;
    }
};

module.exports = Model;
