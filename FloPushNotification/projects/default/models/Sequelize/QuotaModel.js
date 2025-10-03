
const config = {
    tableName: 'quota'

};
const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const Quota = sequelize.define(config.tableName, {
            username: {
                type: DataTypes.STRING,
                primaryKey: true
            },
            bytes: DataTypes.INTEGER,
            messages: DataTypes.INTEGER,
            cal_bytes: DataTypes.INTEGER,
            card_bytes: DataTypes.INTEGER,
            file_bytes: DataTypes.INTEGER,
            num_sent: DataTypes.INTEGER,
            qa_bytes: DataTypes.INTEGER
        }, config);
        return Quota;
    }
};

module.exports = Model;
