// CD + 名
import express from "express";
import { pool as db } from "../../db/connection.js";
const router = express.Router();

// === 前端 api/options.ts  ==

// 共通フォーマッター
const formatOptions = (rows, cdField, nameField) =>
  rows.map((row) => ({
    category: "",
    cd: row[cdField],
    name: row[nameField],
  }));

// 顧客
router.get("/customer-options", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT customer_cd, customer_name FROM customers ORDER BY customer_name`,
    );
    res.json({ success: true, data: formatOptions(rows, "customer_cd", "customer_name") });
  } catch (err) {
    res.status(500).json({ success: false, message: "顧客情報の取得に失敗しました" });
  }
});

// 運送便
router.get("/carrier-options", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT carrier_cd, carrier_name FROM carriers ORDER BY carrier_cd`,
    );
    res.json({ success: true, data: formatOptions(rows, "carrier_cd", "carrier_name") });
  } catch (err) {
    res.status(500).json({ success: false, message: "運送便情報の取得に失敗しました" });
  }
});

// 製品
router.get("/product-options", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT product_cd, product_name, lot_size FROM products ORDER BY product_name`,
    );
    res.json({
      success: true,
      data: formatOptions(rows, "product_cd", "product_name", "lot_size"),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "製品情報の取得に失敗しました" });
  }
});

// 納入先
router.get("/destination-options", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT destination_cd, destination_name FROM delivery_destinations ORDER BY destination_name`,
    );
    res.json({ success: true, data: formatOptions(rows, "destination_cd", "destination_name") });
  } catch (err) {
    res.status(500).json({ success: false, message: "納入先情報の取得に失敗しました" });
  }
});

// 納入先（含issue_type）
router.get("/destination-options-with-issue-type", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT destination_cd, destination_name, issue_type FROM delivery_destinations ORDER BY destination_name`,
    );
    res.json({
      success: true,
      data: rows.map((row) => ({
        cd: row.destination_cd,
        name: row.destination_name,
        issue_type: row.issue_type,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "納入先情報の取得に失敗しました" });
  }
});

// 仕入先
router.get("/supplier-options", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT NULL as category, supplier_cd AS cd, supplier_name AS name
      FROM suppliers
      ORDER BY supplier_name
    `);

    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "仕入先データ取得エラー" });
  }
});

// 材料
router.get("/material-options", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT material_cd AS cd, material_name AS name FROM materials ORDER BY material_name`,
    );
    res.json({
      success: true,
      data: rows.map((row) => ({ category: "", cd: row.cd, name: row.name })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "材料取得失敗", error: err });
  }
});

// 工程ルート
router.get("/route-options", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT route_cd, route_name AS name FROM routes ORDER BY route_cd`,
    );
    res.json({
      success: true,
      data: rows.map((row) => ({ category: "", cd: row.route_cd, name: row.name })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "ルート取得失敗", error: err });
  }
});

// 工程
router.get("/process-options", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT process_cd AS cd, process_name AS name FROM processes ORDER BY process_cd`,
    );
    res.json({
      success: true,
      data: rows.map((row) => ({ category: "", cd: row.cd, name: row.name })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "工程情報の取得に失敗しました", error: err });
  }
});

// 工程詳細情報（歩留・サイクル時間含む）
router.get("/process-details/:process_cd", async (req, res) => {
  try {
    const { process_cd } = req.params;
    const [rows] = await db.query(
      `SELECT process_cd, process_name, default_yield, default_cycle_sec
       FROM processes
       WHERE process_cd = ?`,
      [process_cd],
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "工程が見つかりません" });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "工程詳細情報の取得に失敗しました", error: err });
  }
});

// 部品
router.get("/component-options", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT component_cd AS cd, component_name AS name FROM components ORDER BY component_name`,
    );
    res.json({
      success: true,
      data: rows.map((row) => ({ category: "", cd: row.cd, name: row.name })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "部品オプション取得失敗", error: err });
  }
});

// 製品工程ルート時間、順番
router.get("/product-route-steps", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT prs.product_cd, prs.process_cd, p.product_name, r.process_name
      FROM product_route_steps prs
      LEFT JOIN products p ON prs.product_cd = p.product_cd
      LEFT JOIN processes r ON prs.process_cd = r.process_cd
      ORDER BY prs.product_cd, prs.step_no
    `);

    res.json({
      success: true,
      data: formatOptions(rows, "process_cd", "process_name"),
    });
  } catch (err) {
    console.error("[product-route-steps]", err);
    res.status(500).json({
      success: false,
      message: "製品別工程ルートの取得に失敗しました",
    });
  }
});

// 設備
router.get("/machine-options", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT machine_cd AS cd, machine_name AS name
      FROM machines
      ORDER BY machine_cd
    `);
    res.json({
      success: true,
      data: rows.map((row) => ({
        category: "",
        cd: row.cd,
        name: row.name,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "設備オプション取得失敗", error: err });
  }
});

// 製品+lot_size
router.get("/products-full", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT product_cd, product_name, lot_size
      FROM products
      ORDER BY product_cd
    `);

    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "製品情報の取得に失敗しました" });
  }
});

// BOM
router.get("/bom-options", async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT id, bom_name AS name FROM bom_master ORDER BY id`);
    res.json({
      success: true,
      data: rows.map((row) => ({ category: "", cd: String(row.id), name: row.name })),
    }); // id→cdに変換
  } catch (err) {
    res.status(500).json({ success: false, message: "BOM取得失敗", error: err });
  }
});

// ピッキング担当者（ユーザー）
router.get("/pickers", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT username AS id, name AS name
      FROM users
      WHERE status = 'active'
      ORDER BY name
    `);
    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error("ピッキング担当者取得エラー:", err);
    res.status(500).json({ success: false, message: "担当者情報の取得に失敗しました" });
  }
});

// 納入先选项（用于目的地）
router.get("/destinations", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT destination_cd AS value, destination_name AS label
      FROM delivery_destinations
      ORDER BY destination_name
    `);
    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error("納入先オプション取得エラー:", err);
    res.status(500).json({ success: false, message: "納入先情報の取得に失敗しました" });
  }
});

export default router;
