
const config = {
    tableName: 'restricted_users'

};

const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const RestrictedUser = sequelize.define(config.tableName, {
            name: {
                type: DataTypes.STRING,
                required: true
            },
            type_matcher: {
                type: DataTypes.INTEGER,
                default: 0
            }
        }, config);
        return RestrictedUser;
    }
};

module.exports = Model;
