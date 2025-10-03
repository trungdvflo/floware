
const config = {
    tableName: 'access_tokens'

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
            app_id: {
                type: DataTypes.INTEGER,
                required: true
            },
            email: DataTypes.STRING,
            sub_key: DataTypes.STRING,
            access_token: DataTypes.STRING,
            refresh_token: DataTypes.STRING,
            scope: DataTypes.STRING,
            token_type: DataTypes.STRING,
            expires_in: DataTypes.DOUBLE(),
            expires_in_refresh_token: DataTypes.DOUBLE(),
            user_agent: DataTypes.STRING,
            ip: DataTypes.STRING,
            previous_refresh_token: DataTypes.STRING,
            is_revoked: DataTypes.INTEGER,
            created_date: DataTypes.DOUBLE(13, 3),
            updated_date: DataTypes.DOUBLE(13, 3)
        }, config);
        return Admin;
    }
};

module.exports = Model;
