import express from "express";
import {
  generateRangeAutoBatches,
  updateBatchStatus,
  toggleBatchLock,
  getBatchList,
  rebuildBatch,
  deleteBatch,
  getBatchDetail,
  getBatchOrders,
  getBadBatchList,
  addBatch,
} from "./controllers/batchController.js";
import {
  createPlanStepWithAutoEndTime,
  getGanttData,
  updatePlanStepTime,
  getAllPlans,
  getEfficiency,
  getProcessOptions,
  getMachineOptions,
  validateStepOrder,
  validateStepDrag,
  getMachineAvailability,
  getMachineExceptions,
} from "./controllers/planStepController.js";

import {
  getAllMachines,
  getMachineException,
  addMachineException,
  deleteMachineException,
} from "./controllers/machineController.js";

import { createPlanFromBatch } from "./controllers/createFromBatchController.js";

const router = express.Router();

// 自动生成生产批次（要指定期间）
router.post("/batch/generate-range-auto", generateRangeAutoBatches); // 生成No生成
router.post("/batch/update-status", updateBatchStatus); //BatchDetail.vue    //BatchList.vue
router.post("/batch/toggle-lock", toggleBatchLock); //BatchDetail.vue   //BatchList.vue
router.get("/batch/list", getBatchList); //BatchList.vue
router.post("/batch/rebuild", rebuildBatch); //BatchList.vue
router.post("/batch/delete", deleteBatch); //BatchList.vue
router.get("/batch/detail", getBatchDetail); //取得订单信息  BatchDetail.vue
router.get("/batch/orders", getBatchOrders); //BatchDetail.vue
router.get("/batch/bad-list", getBadBatchList); //BatchBadList.vue
router.post("/batch/add", addBatch); // 新增加生成批次

// 甘特图用
router.post("/steps/create-auto", createPlanStepWithAutoEndTime); // 自动创建步骤;
router.get("/gantt", getGanttData); // 获取甘特图数据
router.post("/steps/update-time", updatePlanStepTime); // 甘特图拖拽更新
router.get("/all", getAllPlans); // 获取任务用
router.get("/efficiency", getEfficiency); // 新增任务用
router.get("/master/processes", getProcessOptions);
router.get("/master/machines", getMachineOptions);
router.get("/validate-step-order", validateStepOrder);
router.get("/validate-step-drag", validateStepDrag);
router.get("/machine/availability", getMachineAvailability);
router.get("/machine/exceptions", getMachineExceptions);

// 设备用
router.get("/machines/all", getAllMachines);
router.get("/machine/exception", getMachineException);
router.post("/machine/exceptions/add", addMachineException);
router.post("/machine/exceptions/delete", deleteMachineException);

// 生成计划拖拽生成
router.post("/p/create-from-batch", createPlanFromBatch);

export default router;
