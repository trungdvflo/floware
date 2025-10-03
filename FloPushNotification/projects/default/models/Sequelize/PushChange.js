const config = {
    tableName: 'push_change'
};

const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const PushChange = sequelize.define(
            config.tableName,
            {
                id: {
                    type: DataTypes.INTEGER,
                    autoIncrement: true,
                    primaryKey: true
                },
                user_id: {
                    type: DataTypes.INTEGER,
                    unique: true
                },
                created_date: {
                    type: DataTypes.DOUBLE(13, 3),
                    required: true
                }
            },
            config
        );

        return PushChange;
    }
};

module.exports = Model;
