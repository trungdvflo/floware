const config = {
    tableName: 'tracking',
    timestamps: false
};

const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        return sequelize.define(
            config.tableName,
            {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                user_id: DataTypes.INTEGER,
                message_id: DataTypes.STRING,
                path: DataTypes.STRING,
                emails: DataTypes.STRING,
                time_tracking: DataTypes.INTEGER,
                subject: DataTypes.STRING,
                uid: DataTypes.STRING,
                acc_id: DataTypes.INTEGER,
                status: DataTypes.INTEGER,
                replied_time: DataTypes.DOUBLE(13, 3),
                email_id: DataTypes.STRING,
                time_send: {
                    type: DataTypes.DOUBLE(13, 3),
                    required: true
                },
                created_date: {
                    type: DataTypes.DOUBLE(13, 3),
                    required: true
                },
                updated_date: {
                    type: DataTypes.DOUBLE(13, 3),
                    required: true
                }
            },
            config
        );
    }
};

module.exports = Model;
