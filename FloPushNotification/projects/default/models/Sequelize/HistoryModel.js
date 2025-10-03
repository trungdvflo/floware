const config = {
    tableName: 'history',
    timestamps: false
};

const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const History = sequelize.define(
            config.tableName,
            {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                user_id: {
                    type: DataTypes.INTEGER,
                    default: 0
                },
                source_id: DataTypes.STRING,
                source_type: DataTypes.STRING,
                obj_id: DataTypes.STRING,
                obj_type: DataTypes.STRING,
                action: DataTypes.INTEGER,
                action_data: DataTypes.STRING,
                created_date: {
                    type: DataTypes.DOUBLE(13, 3),
                    required: true
                },
                updated_date: {
                    type: DataTypes.DOUBLE(13, 3),
                    required: true
                },
                path: DataTypes.STRING,
                source_account: DataTypes.INTEGER,
                destination_account: DataTypes.INTEGER,
                source_root_uid: DataTypes.STRING,
                destination_root_uid: DataTypes.STRING
            },
            config
        );

        return History;
    }
};

module.exports = Model;
