const config = {
    tableName: 'suggested_collections',
    timestamps: false
};

const Model = {
    datastore: 'flowdataSequelize',
    tableName: config.tableName,
    attributes: (sequelize, DataTypes) => {
        const SuggestedCollections = sequelize.define(
            config.tableName,
            {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                project_id: DataTypes.INTEGER,
                criterion_type: DataTypes.INTEGER,
                user_id: DataTypes.INTEGER,
                created_date: {
                    type: DataTypes.DOUBLE(13, 3),
                    required: true
                },
                updated_date: {
                    type: DataTypes.DOUBLE(13, 3),
                    required: true
                },
                criterion_value: DataTypes.STRING,
                frequency_used: DataTypes.INTEGER
            },
            config
        );

        return SuggestedCollections;
    }
};

module.exports = Model;
