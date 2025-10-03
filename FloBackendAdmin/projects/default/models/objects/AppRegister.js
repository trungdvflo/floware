module.exports = function (sequelize, DataTypes) {
    const AppRegister = sequelize.define(
        'AppRegister',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            app_regId: {
                type: DataTypes.STRING,
                field: 'app_reg_id'
            },
            app_alias: DataTypes.STRING,
            email_register: DataTypes.STRING,
            created_date: DataTypes.INTEGER,
            updated_date: DataTypes.INTEGER,
            app_name: DataTypes.STRING
        },
        {
            tableName: 'app_register',
            timestamps: false,
            classMethods: {
                associate(models) {
                    // example on how to add relations
                    // Article.hasMany(models.Comments);
                }
            }
        }
    );

    return AppRegister;
};
