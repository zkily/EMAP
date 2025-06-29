const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// 材料模型
const Material = sequelize.define(
  "Material",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    material_cd: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: "材料编码",
    },
    material_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: "材料名称",
    },
    specification: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: "规格型号",
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "材料分类",
    },
    unit: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: "计量单位",
    },
    standard_cost: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: true,
      comment: "标准成本",
    },
    purchase_price: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: true,
      comment: "采购价格",
    },
    stock_quantity: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: false,
      defaultValue: 0,
      comment: "库存数量",
    },
    safety_stock: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: true,
      comment: "安全库存",
    },
    supplier_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "主供应商ID",
    },
    supplier_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "主供应商名称",
    },
    lead_time: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "采购提前期（天）",
    },
    storage_location: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "存储位置",
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: "状态：0-停用，1-启用",
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "备注",
    },
    created_by: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "创建人",
    },
    updated_by: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "更新人",
    },
  },
  {
    tableName: "materials",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

module.exports = Material;
