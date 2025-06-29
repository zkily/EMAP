const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// 工程（工序）模型
const Process = sequelize.define(
  "Process",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    process_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: "工程编码",
    },
    process_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: "工程名称",
    },
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "所属部门ID",
    },
    department_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "所属部门名称",
    },
    sequence: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "工序顺序",
    },
    standard_time: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: "标准工时（分钟）",
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
  },
  {
    tableName: "processes",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

// 仕掛品（在制品）模型
const WorkInProgress = sequelize.define(
  "WorkInProgress",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    wip_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "仕掛品编码",
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "关联製品ID",
    },
    product_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "製品编码",
    },
    product_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: "製品名称",
    },
    process_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Process,
        key: "id",
      },
      comment: "当前工程ID",
    },
    process_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: "当前工程名称",
    },
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "所在部门ID",
    },
    department_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "所在部门名称",
    },
    lot_no: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "批次号",
    },
    quantity: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: false,
      defaultValue: 0,
      comment: "在制数量",
    },
    unit: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: "计量单位",
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "开始日期",
    },
    planned_finish_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "计划完成日期",
    },
    actual_finish_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "实际完成日期",
    },
    completion_rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0,
      comment: "完成率（%）",
    },
    cost_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0,
      comment: "成本金额",
    },
    status: {
      type: DataTypes.ENUM("planning", "in_progress", "completed", "cancelled"),
      allowNull: false,
      defaultValue: "planning",
      comment: "状态：planning-计划中, in_progress-进行中, completed-已完成, cancelled-已取消",
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
    tableName: "work_in_progress",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

// 设置关联关系
WorkInProgress.belongsTo(Process, {
  foreignKey: "process_id",
  as: "process",
});

Process.hasMany(WorkInProgress, {
  foreignKey: "process_id",
  as: "wipItems",
});

module.exports = {
  Process,
  WorkInProgress,
};
