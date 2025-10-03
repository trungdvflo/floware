const config = {
    tableName: 'admin_promotions'

};
const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const AdminPromotion = sequelize.define(config.tableName, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            allow_pre_signup: {
                type: DataTypes.INTEGER,
                default: 0,
                required: true
            },
            description: {
                type: DataTypes.STRING,
                require: true
            }
        }, config);
        return AdminPromotion;
    }
};

module.exports = Model;
