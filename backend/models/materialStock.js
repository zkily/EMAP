const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Material = require("./material");
const Location = require("./location");
const Supplier = require("./supplier");

const MaterialStock = sequelize.define(
  "MaterialStock",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    material_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Material,
        key: "id",
      },
    },
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Location,
        key: "id",
      },
    },
    supplier_id: {
      type: DataTypes.INTEGER,
      references: {
        model: Supplier,
        key: "id",
      },
    },
    lot_no: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "material_stocks",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        unique: true,
        fields: ["material_id", "location_id", "lot_no"],
      },
    ],
  },
);

// 定义关联关系
MaterialStock.belongsTo(Material, { foreignKey: "material_id" });
MaterialStock.belongsTo(Location, { foreignKey: "location_id" });
MaterialStock.belongsTo(Supplier, { foreignKey: "supplier_id" });

module.exports = MaterialStock;
