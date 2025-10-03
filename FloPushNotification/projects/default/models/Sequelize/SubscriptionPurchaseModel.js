
const config = {
    tableName: 'subscription_purchase'

};
const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const SubscriptionPurchase = sequelize.define(config.tableName, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            user_id: {
                type: DataTypes.INTEGER,
                required: true
            },
            subID: {
                type: DataTypes.STRING,
                field: 'subID',
                required: true
            },
            description: {
                type: DataTypes.STRING,
                required: true
            },
            
            purchase_type: {
                type: DataTypes.INTEGER,
                required: true,
                default: 0
            },
            purchase_status: {
                type: DataTypes.STRING,
                required: true,
                default: 1
            },
            transaction_id: {
                type: DataTypes.STRING,
                required: true
            },
            receipt_data: {
                type: DataTypes.STRING,
                required: true
            },
            is_current: {
                type: DataTypes.STRING,
                required: true,
                default: 0
            },
            created_date: {
                type: DataTypes.DOUBLE(13, 3),
                required: true
            }
        }, config);
        return SubscriptionPurchase;
    }
};

module.exports = Model;
