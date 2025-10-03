const config = {
    tableName: 'email_groups_users'
};

const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const EmailGroupUsers = sequelize.define(
            config.tableName,
            {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                email_group_id: DataTypes.INTEGER,
                user_id: DataTypes.INTEGER,
                created_date: DataTypes.DOUBLE(13, 3),
                updated_date: DataTypes.DOUBLE(13, 3)
            },
            config
        );

        return EmailGroupUsers;
    }
};

module.exports = Model;
