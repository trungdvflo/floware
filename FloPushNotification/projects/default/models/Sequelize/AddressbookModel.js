
const config = {
    tableName: 'addressbooks',
    timestamps: false

};
const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const Addressbook = sequelize.define(config.tableName, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            principaluri: {
                type: DataTypes.STRING
            },
            displayname: {
                type: DataTypes.STRING
            },
            uri: {
                type: DataTypes.STRING
            },
            description: {
                type: DataTypes.TEXT
            },
            synctoken: {
                type: DataTypes.INTEGER,
                default: 1,
                required: true
            }
        }, config);

        Addressbook.associate = (models) => {
            Addressbook.hasMany(models.cards, {
                as: 'card',
                foreignKey: 'addressbookid'
            });
        };

        return Addressbook;
    }
};

module.exports = Model;
