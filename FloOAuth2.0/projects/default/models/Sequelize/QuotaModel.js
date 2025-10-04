
const config = {
  tableName: 'quota',
  model: 'QuotaModel'
};

const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    const Quota = sequelize.define(config.model, {
      username: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      bytes: {
        type: DataTypes.NUMBER,
      },
      messages: {
        type: DataTypes.NUMBER,
      },
      cal_bytes: {
        type: DataTypes.NUMBER,
      },
      card_bytes: {
        type: DataTypes.NUMBER,
      },
      file_bytes: {
        type: DataTypes.NUMBER,
      },
      num_sent: {
        type: DataTypes.NUMBER,
      },
      qa_bytes: {
        type: DataTypes.NUMBER,
      }
    }, config);
    return Quota;
  }
};

module.exports = Model;
