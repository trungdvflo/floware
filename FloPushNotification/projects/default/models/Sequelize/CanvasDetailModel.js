
const config = {
    tableName: 'canvas_detail'

};

const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const Cards = sequelize.define(config.tableName, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            user_id: {
                type: DataTypes.INTEGER,
                required: true
            },
            collection_id: DataTypes.INTEGER,
            item_card_order: DataTypes.INTEGER,
            item_id: DataTypes.STRING,
            item_type: DataTypes.STRING,
            kanban_id: DataTypes.INTEGER,
            source_account: DataTypes.INTEGER,
            order_number: DataTypes.INTEGER,
            order_update_time: DataTypes.DOUBLE(13, 3),
            created_date: DataTypes.DOUBLE(13, 3),
            updated_date: DataTypes.DOUBLE(13, 3)

        }, config);

        return Cards;
    }
};

module.exports = Model;
