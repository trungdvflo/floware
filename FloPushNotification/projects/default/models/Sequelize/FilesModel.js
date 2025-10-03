
const config = {
    tableName: 'files'

};

const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const Files = sequelize.define(config.tableName, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            user_id: {
                type: DataTypes.INTEGER,
                required: true
            },
            uid: {
                type: DataTypes.STRING,
                required: true
            },
            local_path: {
                type: DataTypes.STRING,
                required: true
            },
            url: {
                type: DataTypes.STRING,
                required: true
            },
            source: {
                type: DataTypes.INTEGER,
                required: true
            },
            filename: {
                type: DataTypes.STRING,
                required: true
            },
            ext: {
                type: DataTypes.STRING,
                required: true
            },
            obj_id: {
                type: DataTypes.STRING
            },
            obj_type: {
                type: DataTypes.STRING
            },
            client_id: {
                type: DataTypes.STRING,
                required: true
            },
            size: {
                type: DataTypes.INTEGER,
                required: true
            },
            created_date: DataTypes.DOUBLE(13, 3),
            updated_date: DataTypes.DOUBLE(13, 3)

        }, config);

        return Files;
    }
};

module.exports = Model;
