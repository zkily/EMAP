const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// 製品（产品）模型
const Product = sequelize.define(
  "Product",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    product_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: "製品编码",
    },
    product_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: "製品名称",
    },
    specification: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: "规格型号",
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "产品分类",
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
    selling_price: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: true,
      comment: "销售价格",
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
    lead_time: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "生产提前期（天）",
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
    tableName: "products",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

module.exports = Product;
