//开启服务器启动的项目
process.env.TZ = "Asia/Tokyo";
import express from "express";
import cors from "cors"; //跨域

// ログイン
import userlogin from "./routes/login/login.js";

// システム
import systemLogsRouter from "./routes/system/system.js";
import notificationRouter from "./routes/system/notification.js";
import permissionsRouter from "./routes/system/permissions.js"; // 权限管理路由

// マスタ管理 路由聚合
import masterRoutes from "./routes/master/index.js";

// 受注管理
import orderRouter from "./routes/order/order.js";

// 生産計画管理
import planRouter from "./routes/plan/plan.js";
import batchplanRouter from "./routes/plan/batchpaln.js";

// 在庫管理
import { startStockTransactionWatcher } from "./routes/stock/services/importStockService.js"; // 监听文件导入
import stockRoutes from "./routes/stock/productStockRoutes.js"; // 製品在庫
import wipStockRoutes from "./routes/stock/wipStockRoutes.js"; // wip在庫
import materialsRouter from "./routes/stock/materialStockRouters.js"; // 材料在庫

// 出荷管理
import shippingRouter from "./routes/shipping/shippingRouter.js";
import pickingRouter from "./routes/shipping/pickingRouter.js";
import pickingExportRouter from "./routes/shipping/pickingExportRouter.js";
import fileWatcherRouter from "./routes/shipping/fileWatcherRouter.js";
import printingRouter from "./routes/shipping/printingRouter.js";
import weldingShippingRouter from "./routes/shipping/weldingShippingRouter.js";
import printHistoryRouter from "./routes/shipping/printHistoryRouter.js";

// 外注管理
import outsourcingRouter from "./routes/outsourcing.js";

// schedule
import machineScheduleRouter from "./routes/schedule/machineSchedule.js";
import scheduleRouter from "./routes/schedule/schedule.js";

// 自动运行程序
import "./utils/cron.js";

// 文件监视器
import { startFileWatcher } from "./routes/shipping/services/fileWatcherService.js";

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.disable("etag");
// ログイン
app.use("/api/user", userlogin);

// システム
app.use("/api/system", systemLogsRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api", permissionsRouter); // 挂载权限管理路由

// マスタ管理 路由统一挂载
masterRoutes.forEach(({ path, router }) => {
  app.use(`/api/master${path}`, router);
});

// 受注管理
app.use("/api/order", orderRouter);

// 生産計画管理
app.use("/api/plan", planRouter);
app.use("/api/p", batchplanRouter);
app.use("/api/schedule", machineScheduleRouter);
app.use("/api/schedule/production", scheduleRouter);

// 在庫管理
startStockTransactionWatcher(); // 监听文件导入
app.use("/api/stock", stockRoutes);
app.use("/api/stock/wip", wipStockRoutes);
app.use("/api/stock/materials", materialsRouter);

// 出荷管理
app.use("/api/shipping", shippingRouter);
app.use("/api/shipping/picking", pickingRouter);
app.use("/api/shipping/export", pickingExportRouter);
app.use("/api/shipping/file-watcher", fileWatcherRouter);
app.use("/api/shipping/printing", printingRouter);
app.use("/api/shipping/welding", weldingShippingRouter);
app.use("/api/shipping/print", printHistoryRouter);

// 外注管理
app.use("/api/outsourcing", outsourcingRouter);

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "サーバーエラー",
    error: err.message,
  });
});

// 前端（上线时用）

import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const rootDir = path.dirname(__filename);
const frontendDist = path.join(rootDir, "../frontend/dist");
app.use(express.static(frontendDist));
app.get("*", (req, res) => {
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(frontendDist, "index.html"));
  }
});
// 启动服务器
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`服务器已启动: http://192.168.1.59:${PORT}`);

  // 启动文件监视器
  setTimeout(() => {
    console.log("正在启动文件监视器...");
    startFileWatcher();
  }, 3000); // 延迟3秒启动，确保数据库连接已建立
});

// 启动服务器
// const PORT = 3000;
// app.listen(PORT, () => {
//   console.log(`服务器已启动: http://localhost:${PORT}`);
// });
