const express = require("express");
const router = express.Router();
const db = require("../db/connection");
const dateCalculator = require("../utils/dateCalculator");
const moment = require("moment");

// 生成日订单
router.post("/generate-daily-orders", async (req, res) => {
  const { year, month } = req.body;

  try {
    // 开启事务
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // 获取月订单数据
      const [monthlyOrders] = await connection.query(
        `SELECT mo.*, dd.id as destination_id
         FROM order_monthly mo
         JOIN delivery_destinations dd ON mo.destination_code = dd.code
         WHERE YEAR(mo.order_date) = ? AND MONTH(mo.order_date) = ?`,
        [year, month],
      );

      // 处理每个月订单
      for (const order of monthlyOrders) {
        const startDate = moment(`${year}-${month}-01`).format("YYYY-MM-DD");
        const deliveryDate = await dateCalculator.calculateDeliveryDate(
          startDate,
          order.destination_id,
        );

        // 插入日订单
        await connection.query(
          `INSERT INTO order_daily
           (monthly_order_id, order_date, delivery_date, quantity, status)
           VALUES (?, ?, ?, ?, 'pending')`,
          [order.id, startDate, deliveryDate, order.quantity],
        );
      }

      // 提交事务
      await connection.commit();
      res.json({ success: true, message: "日订单生成成功" });
    } catch (error) {
      // 发生错误时回滚事务
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("生成日订单时发生错误:", error);
    res.status(500).json({
      success: false,
      message: "生成日订单失败",
      error: error.message,
    });
  }
});

module.exports = router;
