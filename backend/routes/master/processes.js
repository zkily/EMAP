// 工程マスタ
import { Router } from "express";
import {
  listProcesses,
  createProcess,
  updateProcess,
  deleteProcess,
} from "./controllers/processController.js";
const router = Router();

// === 前端 api/master/processMaster.ts  ==

// 取得工程列表
router.get("/", listProcesses);

// 新增工程
router.post("/", createProcess);

// 更新工程
router.put("/:id", updateProcess);

// 删除工程
router.delete("/:id", deleteProcess);

export default router;
