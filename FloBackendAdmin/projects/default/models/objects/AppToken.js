module.exports = function (sequelize, DataTypes) {
    const AppToken = sequelize.define(
        'AppToken',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            app_pregId: {
                type: DataTypes.STRING,
                required: true
            },
            key_api: {
                type: DataTypes.STRING,
                required: true
            },
            time_expire: {
                type: DataTypes.STRING,
                required: true
            },
            token: {
                type: DataTypes.STRING
            },
            user_id: {
                type: DataTypes.INTEGER
            },
            email: {
                type: DataTypes.STRING
            }
        },
        {
            tableName: 'app_token',
            timestamps: false,
            classMethods: {
                associate(models) {
                    // example on how to add relations
                    // Article.hasMany(models.Comments);
                }
            }
        }
    );

    return AppToken;
};
