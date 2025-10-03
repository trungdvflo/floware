
const config = {
    tableName: 'projects'

};
const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const Projects = sequelize.define(config.tableName, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            
            proj_name: {
                type: DataTypes.STRING,
                require: true
            },
            proj_color: {
                type: DataTypes.STRING
            },
            
            user_id: {
                type: DataTypes.INTEGER
            },
            calendar_id: {
                type: DataTypes.STRING
            },
            parent_id: {
                type: DataTypes.INTEGER
            },
            flag: {
                type: DataTypes.INTEGER,
                require: true
            },
            proj_type: {
                type: DataTypes.INTEGER,
                require: true
            },
            info_card_order: {
                type: DataTypes.INTEGER,
                require: true
            },
            current_mode: {
                type: DataTypes.INTEGER,
                require: true
            },
            is_hide: {
                type: DataTypes.INTEGER,
                require: true
            },
            alerts: {
                type: DataTypes.STRING,
                require: true
            },
            state: {
                type: DataTypes.INTEGER
            },
            is_expand: {
                type: DataTypes.INTEGER,
                require: true
            },
            order_storyboard: {
                type: DataTypes.STRING,
                require: true
            },
            order_kanban: {
                type: DataTypes.STRING,
                require: true
            },
            view_mode: {
                type: DataTypes.INTEGER,
                require: true
            },
            view_sort: {
                type: DataTypes.INTEGER,
                require: true
            },
            kanban_mode: {
                type: DataTypes.INTEGER
            },

            due_date: {
                type: DataTypes.DOUBLE(13, 3)
            },
            recent_time: {
                type: DataTypes.DOUBLE(13, 3),
                require: true
            },
            created_date: DataTypes.DOUBLE(13, 3),
            updated_date: DataTypes.DOUBLE(13, 3)
            
        }, config);

        Projects.associate = (models) => {
            Projects.belongsTo(models.users, {
                as: 'user', 
                foreignKey: 'user_id'
            });

            Projects.hasMany(models.rules_filter_actions, {
                as: 'rules_filter_actions', 
                foreignKey: 'project_id'
            });
        };

        return Projects;
    }
};

module.exports = Model;
