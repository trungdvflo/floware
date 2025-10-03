const config = {
    tableName: 'trash',
    timestamps: false

};
const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const Trash = sequelize.define(config.tableName, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },

            user_id: {
                type: DataTypes.INTEGER,
                default: 0,
                required: true
            },
            obj_type: {
                type: DataTypes.STRING,
                required: true
            },
            obj_id: {
                type: DataTypes.STRING
            },
            sync_token: {
                type: DataTypes.INTEGER,
                default: 0
            },
            status: {
                type: DataTypes.INTEGER,
                default: 1,
                required: true
            },
            trash_time: {
                type: DataTypes.DOUBLE(13, 3),
                required: true,
                default: 0.000
            },
            created_date: {
                type: DataTypes.DOUBLE(13, 3),
                required: true,
                default: 0.000
            },
            updated_date: {
                type: DataTypes.DOUBLE(13, 3),
                required: true,
                default: 0.000
            }

        }, config);

        return Trash;
    }
};

module.exports = Model;
