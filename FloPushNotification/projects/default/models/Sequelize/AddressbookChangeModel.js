const config = {
    tableName: 'addressbookchanges',
    timestamps: false
};
const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const AddressbookChange = sequelize.define(
            config.tableName,
            {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                uri: {
                    type: DataTypes.STRING
                },
                synctoken: {
                    type: DataTypes.INTEGER
                },
                addressbookid: {
                    type: DataTypes.INTEGER
                },
                operation: {
                    type: DataTypes.INTEGER
                }
            },
            config
        );

        return AddressbookChange;
    }
};

module.exports = Model;
