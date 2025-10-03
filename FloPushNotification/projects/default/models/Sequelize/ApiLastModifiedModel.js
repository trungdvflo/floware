const config = {
    tableName: 'api_last_modified'
};

const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const ApiLastModified = sequelize.define(
            config.tableName,
            {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                user_id: {
                    type: DataTypes.INTEGER,
                    required: true
                },
                api_name: {
                    type: DataTypes.STRING,
                    required: true
                },
                api_last_modified: DataTypes.DOUBLE(13, 3),
                created_date: DataTypes.DOUBLE(13, 3),
                updated_date: DataTypes.DOUBLE(13, 3)
            },
            config
        );

        return ApiLastModified;
    }
};

module.exports = Model;
