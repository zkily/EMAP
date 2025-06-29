import express from "express";
import {
  fetchWipStock,
  handleRecalculateWipStock,
} from "./controllers/wipStockController.js";
import { getProcessOrder } from "./services/wipStockService.js";

const router = express.Router();

router.get("/", fetchWipStock); // wip库存数据读取

router.post("/recalculate", handleRecalculateWipStock); // WIP在库再计算 和 WIP快照保存

router.get("/route-process-order", getProcessOrder); // 工程顺序取得


export default router;
