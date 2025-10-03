
const config = {
    tableName: 'recent_objects'

};

const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const RecentObjects = sequelize.define(config.tableName, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            user_id: {
                type: DataTypes.INTEGER,
                required: true
            },
            state: {
                type: DataTypes.INTEGER,
                default: 0
            },
            dav_type: DataTypes.STRING,
            uid: DataTypes.STRING,
            set_account_id: DataTypes.INTEGER,
            root_uid: DataTypes.STRING,
            created_date: DataTypes.DOUBLE(13, 3),
            updated_date: DataTypes.DOUBLE(13, 3)

        }, config);

        return RecentObjects;
    }
};

module.exports = Model;
