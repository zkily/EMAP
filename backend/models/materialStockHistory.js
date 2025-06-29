const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const MaterialStock = require("./materialStock");

const MaterialStockHistory = sequelize.define(
  "MaterialStockHistory",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    material_stock_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: MaterialStock,
        key: "id",
      },
    },
    operation_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [["IN", "OUT", "ADJUST"]],
      },
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    before_quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    after_quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    remarks: {
      type: DataTypes.TEXT,
    },
    created_by: {
      type: DataTypes.STRING(50),
    },
  },
  {
    tableName: "material_stock_histories",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
);

MaterialStockHistory.belongsTo(MaterialStock, { foreignKey: "material_stock_id" });

module.exports = MaterialStockHistory;
