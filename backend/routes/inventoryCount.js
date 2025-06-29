const express = require("express");
const router = express.Router();
const { Op, Sequelize } = require("sequelize");
const {
  InventoryCount,
  InventoryCountDetail,
  InventoryAdjustment,
} = require("../models/inventoryCount");
const Product = require("../models/product");
const { WorkInProgress, Process } = require("../models/workInProgress");
const Material = require("../models/material");
const Component = require("../models/component");

// 生成盘点单号
const generateCountNo = () => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const timestamp = now.getTime().toString().slice(-6);
  return `PD${year}${month}${day}${timestamp}`;
};

// 生成调整单号
const generateAdjustmentNo = () => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const timestamp = now.getTime().toString().slice(-6);
  return `TZ${year}${month}${day}${timestamp}`;
};

// 获取盘点单列表
router.get("/list", async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      countType,
      status,
      countNo,
      countPerson,
      startDate,
      endDate,
      departmentId,
      processId,
    } = req.query;

    const where = {};

    if (countType) where.count_type = countType;
    if (status) where.status = status;
    if (countNo) where.count_no = { [Op.like]: `%${countNo}%` };
    if (countPerson) where.count_person = { [Op.like]: `%${countPerson}%` };
    if (departmentId) where.department_id = departmentId;
    if (processId) where.process_id = processId;

    if (startDate && endDate) {
      where.count_date = {
        [Op.between]: [startDate, endDate],
      };
    } else if (startDate) {
      where.count_date = { [Op.gte]: startDate };
    } else if (endDate) {
      where.count_date = { [Op.lte]: endDate };
    }

    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);

    const { count, rows } = await InventoryCount.findAndCountAll({
      where,
      include: [
        {
          model: InventoryCountDetail,
          as: "details",
          attributes: ["id"],
        },
      ],
      order: [["created_at", "DESC"]],
      offset,
      limit,
    });

    // 统计每个盘点单的明细数量
    const list = rows.map((item) => ({
      ...item.toJSON(),
      detailCount: item.details ? item.details.length : 0,
    }));

    res.json({
      code: 200,
      data: {
        list,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      },
      message: "获取成功",
    });
  } catch (error) {
    console.error("获取盘点单列表失败:", error);
    res.status(500).json({
      code: 500,
      message: "获取盘点单列表失败",
      error: error.message,
    });
  }
});

// 获取盘点单详情
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const inventoryCount = await InventoryCount.findByPk(id, {
      include: [
        {
          model: InventoryCountDetail,
          as: "details",
        },
        {
          model: InventoryAdjustment,
          as: "adjustments",
        },
      ],
    });

    if (!inventoryCount) {
      return res.status(404).json({
        code: 404,
        message: "盘点单不存在",
      });
    }

    res.json({
      code: 200,
      data: inventoryCount,
      message: "获取成功",
    });
  } catch (error) {
    console.error("获取盘点单详情失败:", error);
    res.status(500).json({
      code: 500,
      message: "获取盘点单详情失败",
      error: error.message,
    });
  }
});

// 创建盘点单
router.post("/", async (req, res) => {
  try {
    const {
      countType,
      countDate,
      departmentId,
      departmentName,
      processId,
      processName,
      locationId,
      locationName,
      countPerson,
      remark,
      createdBy,
    } = req.body;

    // 生成盘点单号
    const countNo = generateCountNo();

    const inventoryCount = await InventoryCount.create({
      count_no: countNo,
      count_date: countDate,
      count_type: countType,
      department_id: departmentId,
      department_name: departmentName,
      process_id: processId,
      process_name: processName,
      location_id: locationId,
      location_name: locationName,
      count_person: countPerson,
      remark,
      created_by: createdBy,
      status: "draft",
    });

    res.json({
      code: 200,
      data: inventoryCount,
      message: "创建成功",
    });
  } catch (error) {
    console.error("创建盘点单失败:", error);
    res.status(500).json({
      code: 500,
      message: "创建盘点单失败",
      error: error.message,
    });
  }
});

// 更新盘点单
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      countDate,
      departmentId,
      departmentName,
      processId,
      processName,
      locationId,
      locationName,
      countPerson,
      checkPerson,
      remark,
      updatedBy,
    } = req.body;

    const inventoryCount = await InventoryCount.findByPk(id);
    if (!inventoryCount) {
      return res.status(404).json({
        code: 404,
        message: "盘点单不存在",
      });
    }

    // 只有草稿状态才能修改
    if (inventoryCount.status !== "draft") {
      return res.status(400).json({
        code: 400,
        message: "只有草稿状态的盘点单才能修改",
      });
    }

    await inventoryCount.update({
      count_date: countDate,
      department_id: departmentId,
      department_name: departmentName,
      process_id: processId,
      process_name: processName,
      location_id: locationId,
      location_name: locationName,
      count_person: countPerson,
      check_person: checkPerson,
      remark,
      updated_by: updatedBy,
    });

    res.json({
      code: 200,
      data: inventoryCount,
      message: "更新成功",
    });
  } catch (error) {
    console.error("更新盘点单失败:", error);
    res.status(500).json({
      code: 500,
      message: "更新盘点单失败",
      error: error.message,
    });
  }
});

// 删除盘点单
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const inventoryCount = await InventoryCount.findByPk(id);
    if (!inventoryCount) {
      return res.status(404).json({
        code: 404,
        message: "盘点单不存在",
      });
    }

    // 只有草稿状态才能删除
    if (inventoryCount.status !== "draft") {
      return res.status(400).json({
        code: 400,
        message: "只有草稿状态的盘点单才能删除",
      });
    }

    // 删除明细
    await InventoryCountDetail.destroy({
      where: { count_id: id },
    });

    // 删除主表
    await inventoryCount.destroy();

    res.json({
      code: 200,
      message: "删除成功",
    });
  } catch (error) {
    console.error("删除盘点单失败:", error);
    res.status(500).json({
      code: 500,
      message: "删除盘点单失败",
      error: error.message,
    });
  }
});

// 获取可盘点的物品列表
router.get("/:id/items", async (req, res) => {
  try {
    const { id } = req.params;
    const { keyword, page = 1, pageSize = 50 } = req.query;

    const inventoryCount = await InventoryCount.findByPk(id);
    if (!inventoryCount) {
      return res.status(404).json({
        code: 404,
        message: "盘点单不存在",
      });
    }

    let items = [];
    let total = 0;

    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);

    // 根据盘点类型获取不同的物品
    switch (inventoryCount.count_type) {
      case "product":
        const products = await Product.findAndCountAll({
          where: {
            status: 1,
            ...(keyword && {
              [Op.or]: [
                { product_name: { [Op.like]: `%${keyword}%` } },
                { product_code: { [Op.like]: `%${keyword}%` } },
              ],
            }),
          },
          offset,
          limit,
        });
        items = products.rows.map((item) => ({
          id: item.id,
          code: item.product_code,
          name: item.product_name,
          specification: item.specification,
          unit: item.unit,
          stockQuantity: item.stock_quantity,
          standardCost: item.standard_cost,
        }));
        total = products.count;
        break;

      case "wip":
        const wipWhere = {
          status: { [Op.in]: ["planning", "in_progress"] },
          ...(inventoryCount.department_id && { department_id: inventoryCount.department_id }),
          ...(inventoryCount.process_id && { process_id: inventoryCount.process_id }),
          ...(keyword && {
            [Op.or]: [
              { product_name: { [Op.like]: `%${keyword}%` } },
              { wip_code: { [Op.like]: `%${keyword}%` } },
            ],
          }),
        };

        const wipItems = await WorkInProgress.findAndCountAll({
          where: wipWhere,
          include: [
            {
              model: Process,
              as: "process",
            },
          ],
          offset,
          limit,
        });
        items = wipItems.rows.map((item) => ({
          id: item.id,
          code: item.wip_code,
          name: item.product_name,
          specification: "",
          unit: item.unit,
          stockQuantity: item.quantity,
          standardCost: item.cost_amount / item.quantity || 0,
          processName: item.process_name,
          departmentName: item.department_name,
          lotNo: item.lot_no,
        }));
        total = wipItems.count;
        break;

      case "material":
        const materials = await Material.findAndCountAll({
          where: {
            status: 1,
            ...(keyword && {
              [Op.or]: [
                { material_name: { [Op.like]: `%${keyword}%` } },
                { material_cd: { [Op.like]: `%${keyword}%` } },
              ],
            }),
          },
          offset,
          limit,
        });
        items = materials.rows.map((item) => ({
          id: item.id,
          code: item.material_cd,
          name: item.material_name,
          specification: "",
          unit: item.unit,
          stockQuantity: 0, // 需要从库存表获取
          standardCost: 0,
        }));
        total = materials.count;
        break;

      case "component":
        const components = await Component.findAndCountAll({
          where: {
            status: 1,
            ...(keyword && {
              [Op.or]: [
                { component_name: { [Op.like]: `%${keyword}%` } },
                { component_code: { [Op.like]: `%${keyword}%` } },
              ],
            }),
          },
          offset,
          limit,
        });
        items = components.rows.map((item) => ({
          id: item.id,
          code: item.component_code,
          name: item.component_name,
          specification: item.specification,
          unit: item.unit,
          stockQuantity: item.stock_quantity,
          standardCost: item.standard_cost,
        }));
        total = components.count;
        break;
    }

    res.json({
      code: 200,
      data: {
        list: items,
        total: total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      },
      message: "获取成功",
    });
  } catch (error) {
    console.error("获取可盘点物品列表失败:", error);
    res.status(500).json({
      code: 500,
      message: "获取可盘点物品列表失败",
      error: error.message,
    });
  }
});

// 添加盘点明细
router.post("/:id/details", async (req, res) => {
  try {
    const { id } = req.params;
    const { items } = req.body; // items: [{ itemId, itemCode, itemName, ... }]

    const inventoryCount = await InventoryCount.findByPk(id);
    if (!inventoryCount) {
      return res.status(404).json({
        code: 404,
        message: "盘点单不存在",
      });
    }

    if (inventoryCount.status !== "draft") {
      return res.status(400).json({
        code: 400,
        message: "只有草稿状态的盘点单才能添加明细",
      });
    }

    const details = items.map((item) => ({
      count_id: id,
      item_id: item.itemId,
      item_code: item.itemCode,
      item_name: item.itemName,
      specification: item.specification || "",
      unit: item.unit,
      book_quantity: item.bookQuantity || 0,
      unit_price: item.unitPrice || 0,
      location_code: item.locationCode || "",
      batch_no: item.batchNo || "",
    }));

    const createdDetails = await InventoryCountDetail.bulkCreate(details);

    res.json({
      code: 200,
      data: createdDetails,
      message: "添加成功",
    });
  } catch (error) {
    console.error("添加盘点明细失败:", error);
    res.status(500).json({
      code: 500,
      message: "添加盘点明细失败",
      error: error.message,
    });
  }
});

// 更新盘点明细
router.put("/details/:detailId", async (req, res) => {
  try {
    const { detailId } = req.params;
    const { actualQuantity, remark, isCounted } = req.body;

    const detail = await InventoryCountDetail.findByPk(detailId);
    if (!detail) {
      return res.status(404).json({
        code: 404,
        message: "盘点明细不存在",
      });
    }

    // 计算差异数量和金额
    const differenceQuantity = actualQuantity - detail.book_quantity;
    const differenceAmount = differenceQuantity * (detail.unit_price || 0);

    await detail.update({
      actual_quantity: actualQuantity,
      difference_quantity: differenceQuantity,
      difference_amount: differenceAmount,
      remark,
      is_counted: isCounted || true,
    });

    res.json({
      code: 200,
      data: detail,
      message: "更新成功",
    });
  } catch (error) {
    console.error("更新盘点明细失败:", error);
    res.status(500).json({
      code: 500,
      message: "更新盘点明细失败",
      error: error.message,
    });
  }
});

// 删除盘点明细
router.delete("/details/:detailId", async (req, res) => {
  try {
    const { detailId } = req.params;

    const detail = await InventoryCountDetail.findByPk(detailId);
    if (!detail) {
      return res.status(404).json({
        code: 404,
        message: "盘点明细不存在",
      });
    }

    const inventoryCount = await InventoryCount.findByPk(detail.count_id);
    if (inventoryCount.status !== "draft") {
      return res.status(400).json({
        code: 400,
        message: "只有草稿状态的盘点单才能删除明细",
      });
    }

    await detail.destroy();

    res.json({
      code: 200,
      message: "删除成功",
    });
  } catch (error) {
    console.error("删除盘点明细失败:", error);
    res.status(500).json({
      code: 500,
      message: "删除盘点明细失败",
      error: error.message,
    });
  }
});

// 开始盘点
router.post("/:id/start", async (req, res) => {
  try {
    const { id } = req.params;
    const { updatedBy } = req.body;

    const inventoryCount = await InventoryCount.findByPk(id);
    if (!inventoryCount) {
      return res.status(404).json({
        code: 404,
        message: "盘点单不存在",
      });
    }

    if (inventoryCount.status !== "draft") {
      return res.status(400).json({
        code: 400,
        message: "只有草稿状态的盘点单才能开始盘点",
      });
    }

    // 检查是否有盘点明细
    const detailCount = await InventoryCountDetail.count({
      where: { count_id: id },
    });

    if (detailCount === 0) {
      return res.status(400).json({
        code: 400,
        message: "请先添加盘点明细",
      });
    }

    await inventoryCount.update({
      status: "counting",
      updated_by: updatedBy,
    });

    res.json({
      code: 200,
      data: inventoryCount,
      message: "开始盘点成功",
    });
  } catch (error) {
    console.error("开始盘点失败:", error);
    res.status(500).json({
      code: 500,
      message: "开始盘点失败",
      error: error.message,
    });
  }
});

// 完成盘点
router.post("/:id/complete", async (req, res) => {
  try {
    const { id } = req.params;
    const { checkPerson, updatedBy } = req.body;

    const inventoryCount = await InventoryCount.findByPk(id);
    if (!inventoryCount) {
      return res.status(404).json({
        code: 404,
        message: "盘点单不存在",
      });
    }

    if (inventoryCount.status !== "counting") {
      return res.status(400).json({
        code: 400,
        message: "只有盘点中状态的盘点单才能完成",
      });
    }

    // 检查是否所有明细都已盘点
    const unCountedDetails = await InventoryCountDetail.count({
      where: {
        count_id: id,
        is_counted: false,
      },
    });

    if (unCountedDetails > 0) {
      return res.status(400).json({
        code: 400,
        message: `还有 ${unCountedDetails} 项未完成盘点`,
      });
    }

    await inventoryCount.update({
      status: "completed",
      check_person: checkPerson,
      updated_by: updatedBy,
    });

    res.json({
      code: 200,
      data: inventoryCount,
      message: "完成盘点成功",
    });
  } catch (error) {
    console.error("完成盘点失败:", error);
    res.status(500).json({
      code: 500,
      message: "完成盘点失败",
      error: error.message,
    });
  }
});

// 生成调整单
router.post("/:id/adjustment", async (req, res) => {
  try {
    const { id } = req.params;
    const { adjustmentDate, createdBy, remark } = req.body;

    const inventoryCount = await InventoryCount.findByPk(id, {
      include: [
        {
          model: InventoryCountDetail,
          as: "details",
          where: {
            difference_quantity: { [Op.ne]: 0 },
          },
        },
      ],
    });

    if (!inventoryCount) {
      return res.status(404).json({
        code: 404,
        message: "盘点单不存在",
      });
    }

    if (inventoryCount.status !== "completed") {
      return res.status(400).json({
        code: 400,
        message: "只有已完成的盘点单才能生成调整单",
      });
    }

    if (!inventoryCount.details || inventoryCount.details.length === 0) {
      return res.status(400).json({
        code: 400,
        message: "没有差异数据，无需生成调整单",
      });
    }

    // 计算总调整金额
    const totalAmount = inventoryCount.details.reduce((sum, detail) => {
      return sum + Math.abs(detail.difference_amount || 0);
    }, 0);

    // 判断调整类型（如果有盈有亏，按金额大的类型）
    const profitAmount = inventoryCount.details
      .filter((d) => d.difference_quantity > 0)
      .reduce((sum, d) => sum + (d.difference_amount || 0), 0);

    const lossAmount = inventoryCount.details
      .filter((d) => d.difference_quantity < 0)
      .reduce((sum, d) => sum + Math.abs(d.difference_amount || 0), 0);

    const adjustmentType = profitAmount >= lossAmount ? "profit" : "loss";

    const adjustmentNo = generateAdjustmentNo();

    const adjustment = await InventoryAdjustment.create({
      count_id: id,
      adjustment_no: adjustmentNo,
      adjustment_date: adjustmentDate,
      adjustment_type: adjustmentType,
      total_amount: totalAmount,
      remark,
      created_by: createdBy,
      status: "pending",
    });

    res.json({
      code: 200,
      data: adjustment,
      message: "生成调整单成功",
    });
  } catch (error) {
    console.error("生成调整单失败:", error);
    res.status(500).json({
      code: 500,
      message: "生成调整单失败",
      error: error.message,
    });
  }
});

// 获取盘点统计数据
router.get("/statistics/dashboard", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where = {};

    if (startDate && endDate) {
      where.count_date = {
        [Op.between]: [startDate, endDate],
      };
    }

    // 按状态统计
    const statusStats = await InventoryCount.findAll({
      where,
      attributes: ["status", [Sequelize.fn("COUNT", Sequelize.col("id")), "count"]],
      group: ["status"],
      raw: true,
    });

    // 按类型统计
    const typeStats = await InventoryCount.findAll({
      where,
      attributes: ["count_type", [Sequelize.fn("COUNT", Sequelize.col("id")), "count"]],
      group: ["count_type"],
      raw: true,
    });

    // 差异统计
    const differenceStats = await InventoryCountDetail.findAll({
      include: [
        {
          model: InventoryCount,
          as: "count",
          where,
          attributes: [],
        },
      ],
      attributes: [
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal(
              "CASE WHEN difference_quantity > 0 THEN difference_amount ELSE 0 END",
            ),
          ),
          "profitAmount",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal(
              "CASE WHEN difference_quantity < 0 THEN ABS(difference_amount) ELSE 0 END",
            ),
          ),
          "lossAmount",
        ],
        [
          Sequelize.fn("COUNT", Sequelize.literal("CASE WHEN difference_quantity != 0 THEN 1 END")),
          "differenceCount",
        ],
      ],
      raw: true,
    });

    res.json({
      code: 200,
      data: {
        statusStats,
        typeStats,
        differenceStats: differenceStats[0] || {
          profitAmount: 0,
          lossAmount: 0,
          differenceCount: 0,
        },
      },
      message: "获取成功",
    });
  } catch (error) {
    console.error("获取统计数据失败:", error);
    res.status(500).json({
      code: 500,
      message: "获取统计数据失败",
      error: error.message,
    });
  }
});

// 获取盘点进度
router.get("/:id/progress", async (req, res) => {
  try {
    const { id } = req.params;

    const inventoryCount = await InventoryCount.findByPk(id);
    if (!inventoryCount) {
      return res.status(404).json({
        code: 404,
        message: "盘点单不存在",
      });
    }

    // 统计明细数据
    const stats = await InventoryCountDetail.findAll({
      where: { count_id: id },
      attributes: [
        [Sequelize.fn("COUNT", Sequelize.col("id")), "totalCount"],
        [
          Sequelize.fn("SUM", Sequelize.literal("CASE WHEN is_counted = 1 THEN 1 ELSE 0 END")),
          "countedCount",
        ],
        [
          Sequelize.fn("SUM", Sequelize.literal("CASE WHEN is_counted = 0 THEN 1 ELSE 0 END")),
          "uncountedCount",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("CASE WHEN difference_quantity != 0 THEN 1 ELSE 0 END"),
          ),
          "differenceCount",
        ],
      ],
      raw: true,
    });

    const result = stats[0] || {
      totalCount: 0,
      countedCount: 0,
      uncountedCount: 0,
      differenceCount: 0,
    };

    // 计算进度百分比
    const progressRate =
      result.totalCount > 0 ? Math.round((result.countedCount / result.totalCount) * 100) : 0;

    res.json({
      code: 200,
      data: {
        ...result,
        progressRate,
      },
      message: "获取成功",
    });
  } catch (error) {
    console.error("获取盘点进度失败:", error);
    res.status(500).json({
      code: 500,
      message: "获取盘点进度失败",
      error: error.message,
    });
  }
});

module.exports = router;
