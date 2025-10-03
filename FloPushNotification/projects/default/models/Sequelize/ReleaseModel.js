const config = {
    tableName: 'releases'

};
const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const Releases = sequelize.define(config.tableName, {
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
            description: DataTypes.STRING,
            file_name: DataTypes.STRING,
            os_support: DataTypes.STRING,
            release_time: DataTypes.INTEGER,
            release_status: DataTypes.STRING,
            created_date: DataTypes.DOUBLE(13, 3),
            updated_date: DataTypes.DOUBLE(13, 3)
        }, config);

        Releases.associate = (models) => {
            Releases.belongsTo(models.users, {
                as: 'user', 
                foreignKey: 'user_id'
            });

            Releases.hasMany(models.releases_groups, {
                as: 'releaseGroups', 
                foreignKey: 'release_id'
            });

            Releases.hasMany(models.releases_users, {
                as: 'releaseUsers', 
                foreignKey: 'release_id'
            });
        };

        return Releases;
    }
};

module.exports = Model;
