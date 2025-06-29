// 材料マスタ
import express from "express";
import { pool as db } from "../../db/connection.js";
import { success, fail } from "../../utils/response.js";
const router = express.Router();

// === 前端 api/master/materiaMaster.ts  ==

// 材料一覧取得
router.get("/", async (req, res) => {
  const { keyword = "" } = req.query;

  try {
    let sql = `
      SELECT
          m.id,
          m.material_cd,
          m.material_name,
          m.material_type,
          m.standard_spec,
          m.pieces_per_bundle,
          m.unit,
          m.supply_classification,
          m.supplier_cd,
          m.status,
          s.supplier_name
      FROM materials m
      LEFT JOIN suppliers s ON m.supplier_cd = s.supplier_cd
    `;

    const params = [];

    if (keyword) {
      sql += `
        WHERE
          m.material_name LIKE ?
       OR m.standard_spec LIKE ?
       OR s.supplier_name LIKE ?
      `;
      const likeKeyword = `%${keyword}%`;
      params.push(likeKeyword, likeKeyword, likeKeyword);
    }

    sql += ` ORDER BY m.id DESC`;

    const [rows] = await db.query(sql, params);
    success(res, rows);
  } catch (err) {
    fail(res, "材料一覧取得に失敗しました", err);
  }
});

// 材料詳細取得
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT * FROM materials WHERE id = ?`, [req.params.id]);
    if (rows.length === 0) return fail(res, "データが存在しません");
    const material = rows[0];
    const numberFields = [
      "diameter",
      "thickness",
      "length",
      "long_weight",
      "lead_time",
      "safety_stock",
      "unit_price",
      "single_price",
      "pieces_per_bundle",
    ];
    numberFields.forEach((field) => {
      if (material[field] === null) material[field] = 0;
    });

    success(res, material);
  } catch (err) {
    fail(res, "材料詳細取得に失敗しました", err);
  }
});

// 材料新規登録
router.post("/", async (req, res) => {
  const data = req.body;
  try {
    const [result] = await db.query(`INSERT INTO materials SET ?`, [data]);
    success(res, { id: result.insertId }, "登録成功");
  } catch (err) {
    fail(res, "登録失敗", err);
  }
});

// 材料更新
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const data = req.body;

  const formatDateTime = (date) => {
    const pad = (n) => (n < 10 ? "0" + n : n);
    return (
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
      `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    );
  };

  try {
    const updated_at = formatDateTime(new Date());

    await db.query(
      `
      UPDATE materials SET
        material_cd = ?,
        material_name = ?,
        material_type = ?,
        standard_spec = ?,
        pieces_per_bundle = ?,
        unit = ?,
        supply_classification = ?,
        supplier_cd = ?,
        status = ?,
        updated_at = ?
      WHERE id = ?
    `,
      [
        data.material_cd,
        data.material_name,
        data.material_type,
        data.standard_spec,
        data.pieces_per_bundle,
        data.unit,
        data.supply_classification,
        data.supplier_cd,
        data.status,
        updated_at,
        id,
      ],
    );

    res.json({ success: true, message: "更新しました" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 材料削除
router.delete("/:id", async (req, res) => {
  try {
    await db.query(`DELETE FROM materials WHERE id = ?`, [req.params.id]);
    success(res, null, "削除成功");
  } catch (err) {
    fail(res, "削除失敗", err);
  }
});

// 材料CD重複チェック
router.get("/check-code", async (req, res) => {
  const { code, id = 0 } = req.query;
  try {
    const [rows] = await db.query(
      `SELECT COUNT(*) AS cnt FROM materials WHERE material_cd = ? AND id != ?`,
      [code, id],
    );
    success(res, { exists: rows[0].cnt > 0 });
  } catch (err) {
    fail(res, "CDチェック失敗", err);
  }
});

// 材料CD 最大値取得
router.post("/max-code", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT material_cd
      FROM materials
      ORDER BY id DESC
      LIMIT 1
    `);

    const latestCd = rows[0]?.material_cd ?? "10000";
    success(res, { max_code: latestCd });
  } catch (err) {
    fail(res, "CD取得失敗", err);
  }
});

export default router;
