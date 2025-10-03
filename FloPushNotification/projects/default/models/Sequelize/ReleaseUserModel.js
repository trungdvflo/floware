const config = {
    tableName: 'releases_users'

};
const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const ReleasesUsers = sequelize.define(config.tableName, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            release_id: {
                type: DataTypes.INTEGER,
                required: true
            },
            user_id: {
                type: DataTypes.INTEGER,
                required: true
            },
            created_date: {
                type: DataTypes.INTEGER
            },
            updated_date: {
                type: DataTypes.INTEGER
            }
        }, config);

        ReleasesUsers.associate = (models) => {
            ReleasesUsers.belongsTo(models.users, {
                as: 'user', 
                foreignKey: 'id'
            });

            ReleasesUsers.belongsTo(models.releases, {
                as: 'release', 
                foreignKey: 'id'
            });
        };
        return ReleasesUsers;
    }
};

module.exports = Model;
