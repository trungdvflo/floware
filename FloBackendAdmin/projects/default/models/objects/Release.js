module.exports = function (sequelize, DataTypes) {
    const Release = sequelize.define(
        'Release',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            user_id: {
                type: DataTypes.TEXT,
                required: true
            },
            version: {
                type: DataTypes.STRING,
                required: true
            },
            checksum: {
                type: DataTypes.STRING,
                required: true
            },
            file_uid: {
                type: DataTypes.STRING,
                required: true
            },
            app_id: {
                type: DataTypes.STRING,
                required: true
            },
            build_number: {
                type: DataTypes.INTEGER,
                required: true
            },
            length: {
                type: DataTypes.INTEGER,
                required: true
            },
            file_dsym: {
                type: DataTypes.STRING,
                required: true
            },
            file_dsym_uid: {
                type: DataTypes.STRING,
                required: true
            },
            release_note: DataTypes.STRING,
            release_type: {
                type: DataTypes.STRING,
                required: true
            },
            url_download: DataTypes.STRING,
            description: DataTypes.STRING,
            file_name: DataTypes.STRING,
            os_support: DataTypes.STRING,
            release_time: DataTypes.INTEGER,
            release_status: DataTypes.STRING,
            created_date: DataTypes.DOUBLE(13, 3),
            updated_date: DataTypes.DOUBLE(13, 3)
        },
        {
            tableName: 'release',
            timestamps: false,
            classMethods: {
                associate(models) {
                    // example on how to add relations
                    // Article.hasMany(models.Comments);
                }
            }
        }
    );

    return Release;
};
