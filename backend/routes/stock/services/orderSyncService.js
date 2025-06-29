import { db } from "../../../db/index.js";

// 共通ログ
async function logSystem(message) {
  await db.query(`INSERT INTO system_logs (message) VALUES (?)`, [message]);
}

// 出荷取消 API
export const cancelShipping = async (req, res) => {
  const { order_daily_id, product_cd, quantity, operator_name = "" } = req.body;

  if (!order_daily_id || !product_cd || !quantity) {
    return res.status(400).json({
      success: false,
      message: "必須パラメータが不足しています",
    });
  }

  try {
    // ✅ 出荷取消履歴
    await db.query(
      `
      INSERT INTO stock_transaction_logs
      (stock_type, target_cd, location_cd, transaction_type, quantity, unit, transaction_time, remarks, process_cd, operator_name, lot_no)
      VALUES ('製品', ?, '製品倉庫', '取消', ?, '本', NOW(), CONCAT('日订单ID:', ?), '', ?, '')
    `,
      [product_cd, quantity, order_daily_id, operator_name]
    );

    // ✅ 注文ステータスを戻す
    await db.query(
      `
      UPDATE order_daily
      SET status = '未出荷'
      WHERE id = ?
    `,
      [order_daily_id]
    );

    res.json({
      success: true,
      message: `日订单 ${order_daily_id} の出荷を取消しました`,
    });
  } catch (err) {
    console.error("出荷取消エラー:", err);
    res.status(500).json({
      success: false,
      message: "出荷取消処理中にエラーが発生しました",
      error: err,
    });
  }
};
