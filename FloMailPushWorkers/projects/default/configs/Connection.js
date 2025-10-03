require('dotenv').config();

module.exports = {
    flowdataSequelize: {
        engine: 'sequelize',
        options: {
            adapter: 'mysql',
            host: process.env.DB_HOST,
            port: process.env.DB_PORT ? process.env.DB_PORT : 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
            migrate: 'alter',
            // pool
            maxConcurrentQueries: 100,
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000,
            // define
            freezeTableName: true, // Table names won't be pluralized.
            syncOnAssociation: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
            timestamps: false, // All tables won't have "createdAt" and "updatedAt" Auto fields.
            underscored: true, // affects are the generated timestamp properties that Sequelize creates when timestamps: true is used; (ie. createdAt => created_at, updatedAt => updated_at etc.)
            debug: process.env.DB_DEBUG === 'true'
        }
    }
    // cache: {
    //     engine: 'cache',
    //     options: {
    //         adapter: 'redis',
    //         config: {
    //             port: process.env.REDIS_PORT,
    //             host: process.env.REDIS_HOST,
    //             database: process.env.REDIS_DB,
    //             password: process.env.REDIS_AUTH
    //         }
    //     }
    // }
    
};
