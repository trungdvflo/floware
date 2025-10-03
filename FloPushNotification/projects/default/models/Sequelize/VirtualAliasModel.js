
const config = {
    tableName: 'virtual_aliases'

};
const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const VirtualAlias = sequelize.define(config.tableName, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            domain_id: {
                type: DataTypes.INTEGER,
                required: true
            },
            source: DataTypes.STRING,
            destination: DataTypes.STRING
        }, config);
        return VirtualAlias;
    }
};

module.exports = Model;
