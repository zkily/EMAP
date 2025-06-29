const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// 盘点单据主表
const InventoryCount = sequelize.define(
  "InventoryCount",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    count_no: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: "盘点单号",
    },
    count_date: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: "盘点日期",
    },
    count_type: {
      type: DataTypes.ENUM("product", "wip", "material", "component"),
      allowNull: false,
      comment: "盘点类型：product-製品, wip-仕掛品, material-材料, component-部品",
    },
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "部门ID（仕掛品专用）",
    },
    department_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "部门名称",
    },
    process_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "工程ID（仕掛品专用）",
    },
    process_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "工程名称",
    },
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "库位ID",
    },
    location_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "库位名称",
    },
    status: {
      type: DataTypes.ENUM("draft", "counting", "completed", "cancelled"),
      allowNull: false,
      defaultValue: "draft",
      comment: "状态：draft-草稿, counting-盘点中, completed-已完成, cancelled-已取消",
    },
    count_person: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "盘点人",
    },
    check_person: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "复核人",
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
    tableName: "inventory_counts",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

// 盘点明细表
const InventoryCountDetail = sequelize.define(
  "InventoryCountDetail",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    count_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: InventoryCount,
        key: "id",
      },
      comment: "盘点单ID",
    },
    item_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "物品ID（根据盘点类型对应不同表的ID）",
    },
    item_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "物品编码",
    },
    item_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: "物品名称",
    },
    specification: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: "规格型号",
    },
    unit: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: "计量单位",
    },
    book_quantity: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: false,
      defaultValue: 0,
      comment: "账面数量",
    },
    actual_quantity: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: true,
      comment: "实盘数量",
    },
    difference_quantity: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: true,
      comment: "差异数量",
    },
    unit_price: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: true,
      comment: "单价",
    },
    difference_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: "差异金额",
    },
    batch_no: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "批次号",
    },
    location_code: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "库位编码",
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "备注",
    },
    is_counted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "是否已盘点",
    },
  },
  {
    tableName: "inventory_count_details",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

// 盘点差异处理记录表
const InventoryAdjustment = sequelize.define(
  "InventoryAdjustment",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    count_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: InventoryCount,
        key: "id",
      },
      comment: "盘点单ID",
    },
    adjustment_no: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: "调整单号",
    },
    adjustment_date: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: "调整日期",
    },
    adjustment_type: {
      type: DataTypes.ENUM("profit", "loss"),
      allowNull: false,
      comment: "调整类型：profit-盘盈, loss-盘亏",
    },
    total_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      comment: "调整总金额",
    },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      allowNull: false,
      defaultValue: "pending",
      comment: "状态：pending-待审核, approved-已审核, rejected-已拒绝",
    },
    approve_person: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "审核人",
    },
    approve_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "审核日期",
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
  },
  {
    tableName: "inventory_adjustments",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

// 设置关联关系
InventoryCount.hasMany(InventoryCountDetail, {
  foreignKey: "count_id",
  as: "details",
});

InventoryCountDetail.belongsTo(InventoryCount, {
  foreignKey: "count_id",
  as: "count",
});

InventoryCount.hasMany(InventoryAdjustment, {
  foreignKey: "count_id",
  as: "adjustments",
});

InventoryAdjustment.belongsTo(InventoryCount, {
  foreignKey: "count_id",
  as: "count",
});

module.exports = {
  InventoryCount,
  InventoryCountDetail,
  InventoryAdjustment,
};
