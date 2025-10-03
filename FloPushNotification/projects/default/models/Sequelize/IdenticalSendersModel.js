const config = {
    tableName: 'identical_senders',
    timestamps: false
};

const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const IdenticalSenders = sequelize.define(
            config.tableName,
            {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                suggested_collection_id: DataTypes.INTEGER,
                user_id: DataTypes.INTEGER,
                email_address: DataTypes.STRING,
                filing_id: DataTypes.INTEGER
            },
            config
        );

        return IdenticalSenders;
    }
};

module.exports = Model;
