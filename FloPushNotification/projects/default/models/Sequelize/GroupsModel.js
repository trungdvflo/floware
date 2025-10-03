
const config = {
    tableName: 'groups',
    timestamps: false

};

const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const Groups = sequelize.define(config.tableName, {
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
                type: DataTypes.TEXT
            },
            group_type: {
                type: DataTypes.ENUM('0', '1'),
                required: true
            },
            created_date: {
                type: DataTypes.INTEGER
            },
            updated_date: {
                type: DataTypes.INTEGER
            }
        }, config);

        Groups.associate = (models) => {
            Groups.hasMany(models.groups_users, {
                as: 'groups_users',
                foreignKey: 'group_id'
            });

            Groups.hasMany(models.releases_groups, {
                as: 'releases_groups',
                foreignKey: 'group_id'
            });
        };
        return Groups;
    }
};

module.exports = Model;
