module.exports = function (sequelize, DataTypes) {
    const User = sequelize.define(
        'User',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            
            username: {
                type: DataTypes.STRING,
                required: true
            },
            digesta1: {
                type: DataTypes.STRING
            },
            domain_id: {
                type: DataTypes.INTEGER
            },
            email: {
                type: DataTypes.STRING,
                required: true
            },
            password: {
                type: DataTypes.STRING,
                required: true
            },
            
            appreg_id: {
                type: DataTypes.STRING
            },
            token_expire: {
                type: DataTypes.DOUBLE(13, 3)
            },
            fullname: {
                type: DataTypes.STRING,
                required: true
            },
            rsa: {
                type: DataTypes.STRING
            },
            description: {
                type: DataTypes.STRING
            },
            secondary_email: {
                type: DataTypes.STRING
            },
            birthday: {
                type: DataTypes.STRING
            },
            country: {
                type: DataTypes.STRING
            },
            phone_number: {
                type: DataTypes.STRING
            },
            country_code: {
                type: DataTypes.STRING
            },
            token: {
                type: DataTypes.STRING
            },
            question: {
                type: DataTypes.STRING
            },
            answer: {
                type: DataTypes.STRING
            },
            gender: {
                type: DataTypes.STRING
            },
            active_sec_email: {
                type: DataTypes.INTEGER
            },
            activated_push: {
                type: DataTypes.INTEGER
            },
            quota_limit_bytes: {
                type: DataTypes.INTEGER
            },
            max_uid: {
                type: DataTypes.INTEGER
            },
            disabled: {
                type: DataTypes.INTEGER
            },
            created_date: DataTypes.DOUBLE(13, 3),
            updated_date: DataTypes.DOUBLE(13, 3)
        },
        {
            tableName: 'user',
            timestamps: false,
            classMethods: {
                associate(models) {
                    // example on how to add relations
                    // Article.hasMany(models.Comments);
                }
            }
        }
    );

    return User;
};
