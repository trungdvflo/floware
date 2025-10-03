const config = {
    tableName: 'users_deleted',
    timestamps: false
};
const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const UsersDeleted = sequelize.define(
            config.tableName,
            {
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
                username: {
                    type: DataTypes.STRING,
                    required: true
                },
                is_disabled: {
                    type: DataTypes.INTEGER
                },
                cleaning_date: {
                    type: DataTypes.DOUBLE(13, 3),
                    required: true
                },
                progress: {
                    type: DataTypes.INTEGER,
                    default: false
                },
                created_date: {
                    type: DataTypes.DOUBLE(13, 3),
                    required: true,
                    default: 0.0
                }
            },
            config
        );
        return UsersDeleted;
    }
};

module.exports = Model;
