module.exports = function (sequelize, DataTypes) {
    const Group = sequelize.define(
        'Group',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            name: {
                type: DataTypes.STRING,
                required: true
            },
            description: {
                type: DataTypes.STRING,
                required: true
            },
            group_type: {
                type: DataTypes.STRING,
                required: true
            },
            created_date: DataTypes.DOUBLE(13, 3),
            updated_date: DataTypes.DOUBLE(13, 3)
        },
        {
            tableName: 'group',
            timestamps: false,
            classMethods: {
                associate(models) {
                    // example on how to add relations
                    // Article.hasMany(models.Comments);
                }
            }
        }
    );

    return Group;
};
