module.exports = function (sequelize, DataTypes) {
    const GroupsUser = sequelize.define(
        'GroupsUser',
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
            group_id: {
                type: DataTypes.INTEGER,
                required: true
            },
            created_date: DataTypes.DOUBLE(13, 3),
            updated_date: DataTypes.DOUBLE(13, 3)
        },
        {
            tableName: 'group_user',
            timestamps: false,
            classMethods: {
                associate(models) {
                    // example on how to add relations
                    // Article.hasMany(models.Comments);
                }
            }
        }
    );

    return GroupsUser;
};
