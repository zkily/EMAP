const { Sequelize } = require("sequelize");
require("dotenv").config();

// 数据库配置
const config = {
  development: {
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "smart_emap",
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    dialectOptions: {
      charset: "utf8mb4",
      dateStrings: true,
      typeCast: true,
    },
    timezone: "+08:00",
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    logging: process.env.NODE_ENV === "development" ? console.log : false,
  },
  test: {
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME_TEST || "smart_emap_test",
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: false,
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    dialectOptions: {
      charset: "utf8mb4",
      ssl:
        process.env.DB_SSL === "true"
          ? {
              require: true,
              rejectUnauthorized: false,
            }
          : false,
    },
    timezone: "+08:00",
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
    },
    pool: {
      max: 20,
      min: 0,
      acquire: 60000,
      idle: 10000,
    },
    logging: false,
  },
};

const env = process.env.NODE_ENV || "development";
const dbConfig = config[env];

// 创建 Sequelize 实例
const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: dbConfig.dialect,
  dialectOptions: dbConfig.dialectOptions,
  timezone: dbConfig.timezone,
  define: dbConfig.define,
  pool: dbConfig.pool,
  logging: dbConfig.logging,
});

// 测试数据库连接
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("数据库连接成功");
    return true;
  } catch (error) {
    console.error("数据库连接失败:", error);
    return false;
  }
};

// 同步数据库表结构
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log("数据库表同步成功");
    return true;
  } catch (error) {
    console.error("数据库表同步失败:", error);
    return false;
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
  config,
};
