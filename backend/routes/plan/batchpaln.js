import express from "express";
import {
  getBatchPool,
  addBatch,
  deleteBatch,
  updateBatch,
  createPlanFromBatch,
  getAllMergedBatches,
  saveMergedBatch,
  deleteMergedBatch,
  syncFromProductionBatches,
} from "./controllers/createFromBatchController.js";

const router = express.Router();
// 生成计划拖拽生成
router.post("/create-from-batch", createPlanFromBatch);

// 左边用
router.get("/batch-pool", getBatchPool);
router.post("/batch-pool", addBatch);
router.delete("/batch-pool/:id", deleteBatch);
router.put("/batch-pool/:id", updateBatch);

router.post("/batch-pool/sync-from-production", syncFromProductionBatches); // 从生产批次表里读取数据到计划列表里

// 中间用
router.get('/batch-merge', getAllMergedBatches)
router.post('/batch-merge', saveMergedBatch)
router.delete('/batch-merge/:id', deleteMergedBatch)



export default router;
