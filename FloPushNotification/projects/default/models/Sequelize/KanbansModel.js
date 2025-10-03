
const config = {
    tableName: 'kanbans'

};
const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const DeviceToken = sequelize.define(config.tableName, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            user_id: {
                type: DataTypes.INTEGER,
                required: true,
                default: 0
            },
            name: {
                type: DataTypes.STRING
            },
            project_id: {
                type: DataTypes.INTEGER,
                required: true,
                default: 0
            },
            color: {
                type: DataTypes.STRING,
                required: true
            },
            order_number: {
                type: DataTypes.INTEGER,
                required: true,
                default: 0
            },
            archive_status: {
                type: DataTypes.INTEGER,
                required: true,
                default: 0
            },
            order_kbitem: {
                type: DataTypes.STRING,
                required: true
            },
            show_done_todo: {
                type: DataTypes.INTEGER,
                required: true,
                default: 1
            },
            add_new_obj_type: {
                type: DataTypes.INTEGER,
                required: true,
                default: 0
            },
            sort_by_type: {
                type: DataTypes.INTEGER,
                required: true,
                default: 0
            },
            kanban_type: {
                type: DataTypes.INTEGER,
                required: true,
                default: 0
            },
            archived_time: DataTypes.DOUBLE(13, 3),
            order_update_time: DataTypes.DOUBLE(13, 3),
            created_date: DataTypes.DOUBLE(13, 3),
            updated_date: DataTypes.DOUBLE(13, 3)

        }, config);

        return DeviceToken;
    }
};

module.exports = Model;
