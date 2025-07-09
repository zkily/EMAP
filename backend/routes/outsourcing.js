import express from "express";
import mysql from "mysql2/promise";
import { config } from "../config/database.js";

const router = express.Router();

const env = process.env.NODE_ENV || "development";
const dbConfig = config[env];

// Sequelizeのコネクション設定をmysql2用に変換
const mysql2Config = {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.username, // `username`を`user`に
  password: dbConfig.password,
  database: dbConfig.database,
  timezone: dbConfig.timezone,
  charset: dbConfig.dialectOptions?.charset,
  waitForConnections: true,
  connectionLimit: dbConfig.pool?.max || 10,
  queueLimit: 0,
};

// データベース接続プール
const pool = mysql.createPool(mysql2Config);

// ===== 1. 外注厂商能力矩阵管理 =====

// 外注厂商能力矩阵一覧取得
router.get("/supplier-capabilities", async (req, res) => {
  try {
    const { supplier_cd, process_cd, capability_level } = req.query;
    let query = `
      SELECT
        osc.*,
        s.supplier_name,
        p.process_name
      FROM outsourcing_supplier_capabilities osc
      LEFT JOIN suppliers s ON osc.supplier_cd = s.supplier_cd
      LEFT JOIN processes p ON osc.process_cd = p.process_cd
      WHERE osc.is_active = 1
    `;
    const params = [];

    if (supplier_cd) {
      query += " AND osc.supplier_cd = ?";
      params.push(supplier_cd);
    }
    if (process_cd) {
      query += " AND osc.process_cd = ?";
      params.push(process_cd);
    }
    if (capability_level) {
      query += " AND osc.capability_level = ?";
      params.push(capability_level);
    }

    query += " ORDER BY osc.supplier_cd, osc.process_cd";

    const [rows] = await pool.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("外注厂商能力矩阵取得エラー:", error);
    res.status(500).json({ success: false, message: "サーバーエラーが発生しました" });
  }
});

// 外注厂商能力矩阵登録
router.post("/supplier-capabilities", async (req, res) => {
  try {
    const {
      supplier_cd,
      process_cd,
      capability_level,
      monthly_capacity,
      lead_time_days,
      quality_rating,
      cost_rating,
      certification_info,
      remarks,
    } = req.body;

    const query = `
      INSERT INTO outsourcing_supplier_capabilities
      (supplier_cd, process_cd, capability_level, monthly_capacity, lead_time_days,
       quality_rating, cost_rating, certification_info, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      supplier_cd,
      process_cd,
      capability_level,
      monthly_capacity,
      lead_time_days,
      quality_rating,
      cost_rating,
      certification_info,
      remarks,
    ]);

    res.json({ success: true, id: result.insertId, message: "外注厂商能力矩阵が登録されました" });
  } catch (error) {
    console.error("外注厂商能力矩阵登録エラー:", error);
    if (error.code === "ER_DUP_ENTRY") {
      res
        .status(400)
        .json({ success: false, message: "同じ仕入先と工程の組み合わせが既に存在します" });
    } else {
      res.status(500).json({ success: false, message: "サーバーエラーが発生しました" });
    }
  }
});

// 外注厂商能力矩阵更新
router.put("/supplier-capabilities/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      capability_level,
      monthly_capacity,
      lead_time_days,
      quality_rating,
      cost_rating,
      certification_info,
      remarks,
      is_active,
    } = req.body;

    const query = `
      UPDATE outsourcing_supplier_capabilities
      SET capability_level = ?, monthly_capacity = ?, lead_time_days = ?,
          quality_rating = ?, cost_rating = ?, certification_info = ?,
          remarks = ?, is_active = ?
      WHERE id = ?
    `;

    const [result] = await pool.execute(query, [
      capability_level,
      monthly_capacity,
      lead_time_days,
      quality_rating,
      cost_rating,
      certification_info,
      remarks,
      is_active,
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "対象のデータが見つかりません" });
    }

    res.json({ success: true, message: "外注厂商能力矩阵が更新されました" });
  } catch (error) {
    console.error("外注厂商能力矩阵更新エラー:", error);
    res.status(500).json({ success: false, message: "サーバーエラーが発生しました" });
  }
});

// ===== 2. 外注厂商绩效评级管理 =====

// 外注厂商绩效评级一覧取得
router.get("/supplier-performance", async (req, res) => {
  try {
    const { supplier_cd, evaluation_period } = req.query;
    let query = `
      SELECT
        osp.*,
        s.supplier_name
      FROM outsourcing_supplier_performance osp
      LEFT JOIN suppliers s ON osp.supplier_cd = s.supplier_cd
      WHERE 1=1
    `;
    const params = [];

    if (supplier_cd) {
      query += " AND osp.supplier_cd = ?";
      params.push(supplier_cd);
    }
    if (evaluation_period) {
      query += " AND osp.evaluation_period = ?";
      params.push(evaluation_period);
    }

    query += " ORDER BY osp.evaluation_period DESC, osp.supplier_cd";

    const [rows] = await pool.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("外注厂商绩效评级取得エラー:", error);
    res.status(500).json({ success: false, message: "サーバーエラーが発生しました" });
  }
});

// 外注厂商绩效评级登録
router.post("/supplier-performance", async (req, res) => {
  try {
    const {
      supplier_cd,
      evaluation_period,
      otd_rate,
      quality_ppm,
      delivery_count,
      defect_count,
      total_amount,
      response_score,
      overall_rating,
      remarks,
    } = req.body;

    const query = `
      INSERT INTO outsourcing_supplier_performance
      (supplier_cd, evaluation_period, otd_rate, quality_ppm, delivery_count,
       defect_count, total_amount, response_score, overall_rating, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      supplier_cd,
      evaluation_period,
      otd_rate,
      quality_ppm,
      delivery_count,
      defect_count,
      total_amount,
      response_score,
      overall_rating,
      remarks,
    ]);

    res.json({ success: true, id: result.insertId, message: "外注厂商绩效评级が登録されました" });
  } catch (error) {
    console.error("外注厂商绩效评级登録エラー:", error);
    if (error.code === "ER_DUP_ENTRY") {
      res
        .status(400)
        .json({ success: false, message: "同じ仕入先と評価期間の組み合わせが既に存在します" });
    } else {
      res.status(500).json({ success: false, message: "サーバーエラーが発生しました" });
    }
  }
});

// ===== 3. 外注价格合同管理 =====

// 外注价格合同一覧取得
router.get("/price-contracts", async (req, res) => {
  try {
    const { supplier_cd, product_cd, process_cd, contract_status } = req.query;
    let query = `
      SELECT
        opc.*,
        s.supplier_name,
        p.process_name
      FROM outsourcing_price_contracts opc
      LEFT JOIN suppliers s ON opc.supplier_cd = s.supplier_cd
      LEFT JOIN processes p ON opc.process_cd = p.process_cd
      WHERE 1=1
    `;
    const params = [];

    if (supplier_cd) {
      query += " AND opc.supplier_cd = ?";
      params.push(supplier_cd);
    }
    if (product_cd) {
      query += " AND (opc.product_cd = ? OR opc.product_cd IS NULL)";
      params.push(product_cd);
    }
    if (process_cd) {
      query += " AND opc.process_cd = ?";
      params.push(process_cd);
    }
    if (contract_status) {
      query += " AND opc.contract_status = ?";
      params.push(contract_status);
    }

    query += " ORDER BY opc.valid_from DESC, opc.supplier_cd";

    const [rows] = await pool.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("外注价格合同取得エラー:", error);
    res.status(500).json({ success: false, message: "サーバーエラーが発生しました" });
  }
});

// 外注价格合同登録
router.post("/price-contracts", async (req, res) => {
  try {
    const {
      contract_no,
      supplier_cd,
      product_cd,
      process_cd,
      unit_price,
      currency,
      price_unit,
      valid_from,
      valid_to,
      min_quantity,
      max_quantity,
      payment_terms,
      remarks,
    } = req.body;

    const query = `
      INSERT INTO outsourcing_price_contracts
      (contract_no, supplier_cd, product_cd, process_cd, unit_price, currency,
       price_unit, valid_from, valid_to, min_quantity, max_quantity,
       payment_terms, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      contract_no,
      supplier_cd,
      product_cd,
      process_cd,
      unit_price,
      currency,
      price_unit,
      valid_from,
      valid_to,
      min_quantity,
      max_quantity,
      payment_terms,
      remarks,
    ]);

    res.json({ success: true, id: result.insertId, message: "外注价格合同が登録されました" });
  } catch (error) {
    console.error("外注价格合同登録エラー:", error);
    if (error.code === "ER_DUP_ENTRY") {
      res.status(400).json({ success: false, message: "同じ契約番号が既に存在します" });
    } else {
      res.status(500).json({ success: false, message: "サーバーエラーが発生しました" });
    }
  }
});

// ===== 4. 外注订单管理 =====

// 外注订单一覧取得
router.get("/orders", async (req, res) => {
  try {
    const { supplier_cd, product_cd, order_status, order_date_from, order_date_to } = req.query;
    let query = `
      SELECT
        oo.*,
        s.supplier_name,
        p.process_name
      FROM outsourcing_orders oo
      LEFT JOIN suppliers s ON oo.supplier_cd = s.supplier_cd
      LEFT JOIN processes p ON oo.process_cd = p.process_cd
      WHERE 1=1
    `;
    const params = [];

    if (supplier_cd) {
      query += " AND oo.supplier_cd = ?";
      params.push(supplier_cd);
    }
    if (product_cd) {
      query += " AND oo.product_cd = ?";
      params.push(product_cd);
    }
    if (order_status) {
      query += " AND oo.order_status = ?";
      params.push(order_status);
    }
    if (order_date_from) {
      query += " AND oo.order_date >= ?";
      params.push(order_date_from);
    }
    if (order_date_to) {
      query += " AND oo.order_date <= ?";
      params.push(order_date_to);
    }

    query += " ORDER BY oo.order_date DESC, oo.order_no";

    const [rows] = await pool.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("外注订单取得エラー:", error);
    res.status(500).json({ success: false, message: "サーバーエラーが発生しました" });
  }
});

// 外注订单詳細取得
router.get("/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT
        oo.*,
        s.supplier_name,
        s.contact_person,
        s.phone,
        s.email,
        p.process_name
      FROM outsourcing_orders oo
      LEFT JOIN suppliers s ON oo.supplier_cd = s.supplier_cd
      LEFT JOIN processes p ON oo.process_cd = p.process_cd
      WHERE oo.id = ?
    `;

    const [rows] = await pool.execute(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "外注订单が見つかりません" });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("外注订单詳細取得エラー:", error);
    res.status(500).json({ success: false, message: "サーバーエラーが発生しました" });
  }
});

// 外注订单登録
router.post("/orders", async (req, res) => {
  try {
    const {
      order_no,
      supplier_cd,
      product_cd,
      process_cd,
      quantity,
      unit_price,
      total_amount,
      currency,
      order_date,
      requested_delivery_date,
      priority,
      work_order_id,
      material_supply_type,
      delivery_location,
      special_instructions,
      remarks,
      created_by,
    } = req.body;

    const query = `
      INSERT INTO outsourcing_orders
      (order_no, supplier_cd, product_cd, process_cd, quantity, unit_price,
       total_amount, currency, order_date, requested_delivery_date,
       priority, work_order_id, material_supply_type, delivery_location,
       special_instructions, remarks, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      order_no,
      supplier_cd,
      product_cd,
      process_cd,
      quantity,
      unit_price,
      total_amount,
      currency,
      order_date,
      requested_delivery_date,
      priority,
      work_order_id,
      material_supply_type,
      delivery_location,
      special_instructions,
      remarks,
      created_by,
    ]);

    res.json({ success: true, id: result.insertId, message: "外注订单が登録されました" });
  } catch (error) {
    console.error("外注订单登録エラー:", error);
    if (error.code === "ER_DUP_ENTRY") {
      res.status(400).json({ success: false, message: "同じ注文番号が既に存在します" });
    } else {
      res.status(500).json({ success: false, message: "サーバーエラーが発生しました" });
    }
  }
});

// 外注订单状态更新
router.put("/orders/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { order_status, confirmed_delivery_date, actual_delivery_date, remarks } = req.body;

    const query = `
      UPDATE outsourcing_orders
      SET order_status = ?, confirmed_delivery_date = ?, actual_delivery_date = ?, remarks = ?
      WHERE id = ?
    `;

    const [result] = await pool.execute(query, [
      order_status,
      confirmed_delivery_date,
      actual_delivery_date,
      remarks,
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "対象の外注订单が見つかりません" });
    }

    res.json({ success: true, message: "外注订单状态が更新されました" });
  } catch (error) {
    console.error("外注订单状态更新エラー:", error);
    res.status(500).json({ success: false, message: "サーバーエラーが発生しました" });
  }
});

// ===== 5. 外注虚拟仓库库存管理 =====

// 外注虚拟仓库库存一覧取得
router.get("/virtual-inventory", async (req, res) => {
  try {
    const { supplier_cd, material_cd } = req.query;
    let query = `
      SELECT
        ovi.*,
        s.supplier_name,
        m.material_name as material_name_from_master
      FROM outsourcing_virtual_inventory ovi
      LEFT JOIN suppliers s ON ovi.supplier_cd = s.supplier_cd
      LEFT JOIN materials m ON ovi.material_cd = m.material_cd
      WHERE 1=1
    `;
    const params = [];

    if (supplier_cd) {
      query += " AND ovi.supplier_cd = ?";
      params.push(supplier_cd);
    }
    if (material_cd) {
      query += " AND ovi.material_cd = ?";
      params.push(material_cd);
    }

    query += " ORDER BY ovi.supplier_cd, ovi.material_cd";

    const [rows] = await pool.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("外注虚拟仓库库存取得エラー:", error);
    res.status(500).json({ success: false, message: "サーバーエラーが発生しました" });
  }
});

// 外注虚拟仓库库存変動履歴取得
router.get("/inventory-transactions", async (req, res) => {
  try {
    const { supplier_cd, material_cd, transaction_type, date_from, date_to } = req.query;
    let query = `
      SELECT
        oit.*,
        s.supplier_name
      FROM outsourcing_inventory_transactions oit
      LEFT JOIN suppliers s ON oit.supplier_cd = s.supplier_cd
      WHERE 1=1
    `;
    const params = [];

    if (supplier_cd) {
      query += " AND oit.supplier_cd = ?";
      params.push(supplier_cd);
    }
    if (material_cd) {
      query += " AND oit.material_cd = ?";
      params.push(material_cd);
    }
    if (transaction_type) {
      query += " AND oit.transaction_type = ?";
      params.push(transaction_type);
    }
    if (date_from) {
      query += " AND DATE(oit.transaction_date) >= ?";
      params.push(date_from);
    }
    if (date_to) {
      query += " AND DATE(oit.transaction_date) <= ?";
      params.push(date_to);
    }

    query += " ORDER BY oit.transaction_date DESC";

    const [rows] = await pool.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("外注虚拟仓库库存変動履歴取得エラー:", error);
    res.status(500).json({ success: false, message: "サーバーエラーが発生しました" });
  }
});

// ===== 6. 外注收货管理 =====

// 外注收货一覧取得
router.get("/receipts", async (req, res) => {
  try {
    const { supplier_cd, product_cd, receipt_status, receipt_date_from, receipt_date_to } =
      req.query;
    let query = `
      SELECT
        orec.*,
        s.supplier_name,
        oo.order_no
      FROM outsourcing_receipts orec
      LEFT JOIN suppliers s ON orec.supplier_cd = s.supplier_cd
      LEFT JOIN outsourcing_orders oo ON orec.order_id = oo.id
      WHERE 1=1
    `;
    const params = [];

    if (supplier_cd) {
      query += " AND orec.supplier_cd = ?";
      params.push(supplier_cd);
    }
    if (product_cd) {
      query += " AND orec.product_cd = ?";
      params.push(product_cd);
    }
    if (receipt_status) {
      query += " AND orec.receipt_status = ?";
      params.push(receipt_status);
    }
    if (receipt_date_from) {
      query += " AND orec.receipt_date >= ?";
      params.push(receipt_date_from);
    }
    if (receipt_date_to) {
      query += " AND orec.receipt_date <= ?";
      params.push(receipt_date_to);
    }

    query += " ORDER BY orec.receipt_date DESC, orec.receipt_no";

    const [rows] = await pool.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("外注收货取得エラー:", error);
    res.status(500).json({ success: false, message: "サーバーエラーが発生しました" });
  }
});

// 外注收货登録
router.post("/receipts", async (req, res) => {
  try {
    const {
      receipt_no,
      order_id,
      supplier_cd,
      product_cd,
      receipt_date,
      receipt_time,
      ordered_quantity,
      received_quantity,
      delivery_note_no,
      lot_no,
      storage_location,
      receiver,
      remarks,
    } = req.body;

    const query = `
      INSERT INTO outsourcing_receipts
      (receipt_no, order_id, supplier_cd, product_cd, receipt_date, receipt_time,
       ordered_quantity, received_quantity, delivery_note_no, lot_no,
       storage_location, receiver, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      receipt_no,
      order_id,
      supplier_cd,
      product_cd,
      receipt_date,
      receipt_time,
      ordered_quantity,
      received_quantity,
      delivery_note_no,
      lot_no,
      storage_location,
      receiver,
      remarks,
    ]);

    res.json({ success: true, id: result.insertId, message: "外注收货が登録されました" });
  } catch (error) {
    console.error("外注收货登録エラー:", error);
    if (error.code === "ER_DUP_ENTRY") {
      res.status(400).json({ success: false, message: "同じ受領番号が既に存在します" });
    } else {
      res.status(500).json({ success: false, message: "サーバーエラーが発生しました" });
    }
  }
});

// ===== 7. 外注质量检验管理 =====

// 外注质量检验一覧取得
router.get("/quality-inspections", async (req, res) => {
  try {
    const { supplier_cd, product_cd, inspection_result, inspection_date_from, inspection_date_to } =
      req.query;
    let query = `
      SELECT
        oqi.*,
        s.supplier_name,
        orec.receipt_no,
        oo.order_no
      FROM outsourcing_quality_inspections oqi
      LEFT JOIN suppliers s ON oqi.supplier_cd = s.supplier_cd
      LEFT JOIN outsourcing_receipts orec ON oqi.receipt_id = orec.id
      LEFT JOIN outsourcing_orders oo ON oqi.order_id = oo.id
      WHERE 1=1
    `;
    const params = [];

    if (supplier_cd) {
      query += " AND oqi.supplier_cd = ?";
      params.push(supplier_cd);
    }
    if (product_cd) {
      query += " AND oqi.product_cd = ?";
      params.push(product_cd);
    }
    if (inspection_result) {
      query += " AND oqi.inspection_result = ?";
      params.push(inspection_result);
    }
    if (inspection_date_from) {
      query += " AND oqi.inspection_date >= ?";
      params.push(inspection_date_from);
    }
    if (inspection_date_to) {
      query += " AND oqi.inspection_date <= ?";
      params.push(inspection_date_to);
    }

    query += " ORDER BY oqi.inspection_date DESC, oqi.inspection_no";

    const [rows] = await pool.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("外注质量检验取得エラー:", error);
    res.status(500).json({ success: false, message: "サーバーエラーが発生しました" });
  }
});

// ===== 8. 外注财务结算管理 =====

// 外注财务结算一覧取得
router.get("/settlements", async (req, res) => {
  try {
    const { supplier_cd, settlement_status, period_from, period_to } = req.query;
    let query = `
      SELECT
        os.*,
        s.supplier_name
      FROM outsourcing_settlements os
      LEFT JOIN suppliers s ON os.supplier_cd = s.supplier_cd
      WHERE 1=1
    `;
    const params = [];

    if (supplier_cd) {
      query += " AND os.supplier_cd = ?";
      params.push(supplier_cd);
    }
    if (settlement_status) {
      query += " AND os.settlement_status = ?";
      params.push(settlement_status);
    }
    if (period_from) {
      query += " AND os.settlement_period_from >= ?";
      params.push(period_from);
    }
    if (period_to) {
      query += " AND os.settlement_period_to <= ?";
      params.push(period_to);
    }

    query += " ORDER BY os.settlement_period_from DESC, os.supplier_cd";

    const [rows] = await pool.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("外注财务结算取得エラー:", error);
    res.status(500).json({ success: false, message: "サーバーエラーが発生しました" });
  }
});

// ===== 9. 外注成本核算管理 =====

// 外注成本核算一覧取得
router.get("/cost-calculations", async (req, res) => {
  try {
    const { product_cd, calculation_date_from, calculation_date_to } = req.query;
    let query = `
      SELECT
        occ.*,
        oo.order_no,
        oo.supplier_cd,
        s.supplier_name
      FROM outsourcing_cost_calculations occ
      LEFT JOIN outsourcing_orders oo ON occ.order_id = oo.id
      LEFT JOIN suppliers s ON oo.supplier_cd = s.supplier_cd
      WHERE 1=1
    `;
    const params = [];

    if (product_cd) {
      query += " AND occ.product_cd = ?";
      params.push(product_cd);
    }
    if (calculation_date_from) {
      query += " AND occ.calculation_date >= ?";
      params.push(calculation_date_from);
    }
    if (calculation_date_to) {
      query += " AND occ.calculation_date <= ?";
      params.push(calculation_date_to);
    }

    query += " ORDER BY occ.calculation_date DESC, occ.product_cd";

    const [rows] = await pool.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("外注成本核算取得エラー:", error);
    res.status(500).json({ success: false, message: "サーバーエラーが発生しました" });
  }
});

// ===== 10. 统计和分析API =====

// 外注订单状态统计
router.get("/statistics/order-status", async (req, res) => {
  try {
    const { supplier_cd, date_from, date_to } = req.query;
    let query = `
      SELECT
        order_status,
        COUNT(*) as count,
        SUM(total_amount) as total_amount
      FROM outsourcing_orders
      WHERE 1=1
    `;
    const params = [];

    if (supplier_cd) {
      query += " AND supplier_cd = ?";
      params.push(supplier_cd);
    }
    if (date_from) {
      query += " AND order_date >= ?";
      params.push(date_from);
    }
    if (date_to) {
      query += " AND order_date <= ?";
      params.push(date_to);
    }

    query += " GROUP BY order_status ORDER BY order_status";

    const [rows] = await pool.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("外注订单状态统计エラー:", error);
    res.status(500).json({ success: false, message: "サーバーエラーが発生しました" });
  }
});

// 外注厂商绩效统计
router.get("/statistics/supplier-performance", async (req, res) => {
  try {
    const { evaluation_period } = req.query;
    let query = `
      SELECT
        osp.supplier_cd,
        s.supplier_name,
        osp.otd_rate,
        osp.quality_ppm,
        osp.overall_rating,
        osp.total_amount
      FROM outsourcing_supplier_performance osp
      LEFT JOIN suppliers s ON osp.supplier_cd = s.supplier_cd
      WHERE 1=1
    `;
    const params = [];

    if (evaluation_period) {
      query += " AND osp.evaluation_period = ?";
      params.push(evaluation_period);
    }

    query += " ORDER BY osp.overall_rating, osp.otd_rate DESC";

    const [rows] = await pool.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("外注厂商绩效统计エラー:", error);
    res.status(500).json({ success: false, message: "サーバーエラーが発生しました" });
  }
});

// ===== 11. 辅助功能API =====

// 获取所有供应商列表
router.get("/suppliers", async (req, res) => {
  try {
    const query = `
      SELECT supplier_cd, supplier_name, contact_person, phone, email
      FROM suppliers
      ORDER BY supplier_cd
    `;

    const [rows] = await pool.execute(query);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("供应商列表取得エラー:", error);
    res.status(500).json({ success: false, message: "サーバーエラーが発生しました" });
  }
});

// 获取外注工序列表
router.get("/processes", async (req, res) => {
  try {
    const query = `
      SELECT process_cd, process_name
      FROM processes
      WHERE is_outsource = 1
      ORDER BY process_cd
    `;

    const [rows] = await pool.execute(query);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("外注工序列表取得エラー:", error);
    res.status(500).json({ success: false, message: "サーバーエラーが発生しました" });
  }
});

// 生成外注订单号
router.get("/generate-order-no", async (req, res) => {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    const prefix = `OUT${year}${month}${day}`;

    const query = `
      SELECT COUNT(*) as count
      FROM outsourcing_orders
      WHERE order_no LIKE ?
    `;

    const [rows] = await pool.execute(query, [`${prefix}%`]);
    const sequence = String(rows[0].count + 1).padStart(3, "0");
    const orderNo = `${prefix}${sequence}`;

    res.json({ success: true, order_no: orderNo });
  } catch (error) {
    console.error("外注订单号生成エラー:", error);
    res.status(500).json({ success: false, message: "サーバーエラーが発生しました" });
  }
});

export default router;
