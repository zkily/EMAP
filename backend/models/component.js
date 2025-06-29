const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// 部品（零部件）模型
const Component = sequelize.define(
  "Component",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    component_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: "部品编码",
    },
    component_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: "部品名称",
    },
    specification: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: "规格型号",
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "部品分类",
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
    min_order_qty: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: true,
      comment: "最小订购量",
    },
    is_critical: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "是否关键部品",
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
    tableName: "components",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

module.exports = Component;
