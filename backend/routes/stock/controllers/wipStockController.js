import {
  getWipStockList,
  recalculateAndSnapshotWipStock,
} from "../services/wipStockService.js";

// wip库存数据读取
export const fetchWipStock = async (req, res) => {
  try {
    const { product_cd, process_cd, location_cd } = req.query;
    const list = await getWipStockList({ product_cd, process_cd, location_cd });
    res.json({ success: true, data: list });
  } catch (err) {
    console.error("仕掛在庫取得エラー:", err);
    res
      .status(500)
      .json({ success: false, message: "仕掛在庫の取得に失敗しました。" });
  }
};

// wip库存计算
export const handleRecalculateWipStock = async (req, res) => {
  try {
    const count = await recalculateAndSnapshotWipStock();
    res.json({ success: true, message: `仕掛計算完了（${count} 件）` });
  } catch (err) {
    console.error("仕掛在庫再計算失敗:", err);
    res.status(500).json({ success: false, message: "エラー発生：再計算失敗" });
  }
};



