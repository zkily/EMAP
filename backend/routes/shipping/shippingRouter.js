// routes/shipping/shippingRouter.js
import express from "express";
import * as shippingService from "./shippingService.js";

const router = express.Router();

router.get("/existing-nos", shippingService.getExistingShippingNos);
router.get("/items", shippingService.getShippingItems);
router.get("/overview", shippingService.getShippingOverview); // 出荷一覧表データ取得 (获取出荷一览表数据)
router.get("/list", shippingService.getShippingList); // 出荷便リストデータ取得 (获取出荷便列表数据)
router.post("/items/bulk", shippingService.bulkInsertShippingItems);
router.put("/items/batch", shippingService.batchUpdateShippingItems); // 批量更新出荷项目
router.put("/items/batch-update-shipping-no", shippingService.batchUpdateShippingNo); // 批量更新出荷番号
router.post("/validate-shipping-no-change", shippingService.validateShippingNoChange); // 出荷番号変更検証
router.get("/:shipping_no/detail", shippingService.getShippingDetail);
router.get("/:shipping_no/items", shippingService.getShippingItemsByNo); // 获取出荷番号的所有项目
router.put("/:shipping_no", shippingService.updateShippingItem);
router.put("/:shipping_no/enhanced", shippingService.updateShippingItemEnhanced); // 增强的出荷更新
router.post("/:shipping_no/issue", shippingService.issueShipping);
router.post("/:shipping_no/cancel", shippingService.cancelShipping);
router.post("/print-record", shippingService.recordPrintAndUpdateStatus);

export default router;
