const config = {
    tableName: 'releases_groups'

};
const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const ReleasesGroups = sequelize.define(config.tableName, {
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
            created_date: {
                type: DataTypes.INTEGER
            },
            updated_date: {
                type: DataTypes.INTEGER
            }
        }, config);

        ReleasesGroups.associate = (models) => {
            ReleasesGroups.belongsTo(models.groups, {
                as: 'group', 
                foreignKey: 'group_id'
            });

            ReleasesGroups.belongsTo(models.releases, {
                as: 'release', 
                foreignKey: 'release_id'
            });
        };
        return ReleasesGroups;
    }
};

module.exports = Model;
