const config = {
    tableName: 'tmp_email_settings'

};
const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const TmpGmailAccessToken = sequelize.define(config.tableName, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            email: {
                type: DataTypes.STRING,
                max: 100,
                required: true
            }

        }, config);

        return TmpGmailAccessToken;
    }
};

module.exports = Model;
