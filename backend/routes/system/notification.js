import express from "express";
import { connectToDatabase } from "../../utils/db.js";

const router = express.Router();

// 获取所有通知
router.get("/", async (req, res) => {
  try {
    // 这里使用模拟数据而不是实际连接数据库
    // 实际开发中，您应该从数据库获取真实数据
    // const db = await connectToDatabase();
    // const notifications = await db.collection('notifications').find().toArray();

    const notifications = [
      {
        id: 1,
        title: "システム通知",
        message: "システムメンテナンスが予定されています",
        date: new Date(),
        read: false,
        type: "system",
      },
      {
        id: 2,
        title: "注文通知",
        message: "新しい注文が届きました",
        date: new Date(Date.now() - 24 * 60 * 60 * 1000),
        read: true,
        type: "order",
      },
    ];

    res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error("通知の取得中にエラーが発生しました:", error);
    res.status(500).json({
      success: false,
      message: "通知の取得中にエラーが発生しました",
      error: error.message,
    });
  }
});

// 将通知标记为已读
router.put("/:id/read", async (req, res) => {
  try {
    const { id } = req.params;

    // 在实际应用中，这里应该更新数据库中的记录

    res.json({
      success: true,
      message: "通知が既読としてマークされました",
      data: { id },
    });
  } catch (error) {
    console.error("通知の更新中にエラーが発生しました:", error);
    res.status(500).json({
      success: false,
      message: "通知の更新中にエラーが発生しました",
      error: error.message,
    });
  }
});

// 将所有通知标记为已读
router.put("/read-all", async (req, res) => {
  try {
    // 在实际应用中，这里应该更新数据库中的所有记录

    res.json({
      success: true,
      message: "すべての通知が既読としてマークされました",
    });
  } catch (error) {
    console.error("通知の更新中にエラーが発生しました:", error);
    res.status(500).json({
      success: false,
      message: "通知の更新中にエラーが発生しました",
      error: error.message,
    });
  }
});

export default router;
