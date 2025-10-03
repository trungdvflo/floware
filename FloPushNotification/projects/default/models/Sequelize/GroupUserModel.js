
const config = {
    tableName: 'groups_users',
    timestamps: false

};

const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const GroupUser = sequelize.define(config.tableName, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            created_date: {
                type: DataTypes.INTEGER
            },
            updated_date: {
                type: DataTypes.INTEGER
            },
            group_id: {
                type: DataTypes.INTEGER
            },
            user_id: {
                type: DataTypes.INTEGER,
                default: 0
            }
        }, config);

        GroupUser.associate = (models) => {
            GroupUser.belongsTo(models.users, {
                as: 'user',
                foreignKey: 'user_id'
            });

            GroupUser.belongsTo(models.groups, {
                as: 'group',
                foreignKey: 'group_id'
            });
        };
        return GroupUser;
    }
};

module.exports = Model;
