module.exports = function (sequelize, DataTypes) {
    const ReleasesGroup = sequelize.define(
        'ReleasesGroup',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            release_id: {
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
            tableName: 'release_group',
            timestamps: false,
            classMethods: {
                associate(models) {
                    // example on how to add relations
                    // Article.hasMany(models.Comments);
                }
            }
        }
    );

    return ReleasesGroup;
};
