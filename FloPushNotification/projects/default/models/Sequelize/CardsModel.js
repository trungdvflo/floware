
const config = {
    tableName: 'cards'

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
            addressbookid: {
                type: DataTypes.INTEGER,
                required: true
            },
            carddata: DataTypes.STRING,
            uri: DataTypes.STRING,

            etag: 'VARBINARY(32)',
            size: DataTypes.INTEGER,
            lastmodified: DataTypes.INTEGER

        }, config);

        Cards.associate = (models) => {
            Cards.belongsTo(models.addressbooks, {
                as: 'addressbooks',
                foreignKey: 'addressbookid'
            });
        };

        return Cards;
    }
};

module.exports = Model;
