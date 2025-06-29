// BOM (部品構成)
import express from "express";
import { pool as db } from "../../db/connection.js";
const router = express.Router();

// 一覧取得
router.get("/list", async (req, res) => {
  const { product_cd, product_name } = req.query;
  const where = [];
  const params = [];

  if (product_cd) {
    where.push("p.product_cd LIKE ?");
    params.push(`%${product_cd}%`);
  }

  if (product_name) {
    where.push("p.product_name LIKE ?");
    params.push(`%${product_name}%`);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  try {
    const [rows] = await db.query(
      `SELECT b.id, b.product_id, b.component_id, b.quantity, b.unit_price, b.note,
        p.product_cd, p.product_name, c.component_cd, c.component_name
      FROM bom b
      JOIN products p ON b.product_id = p.id
      JOIN components c ON b.component_id = c.id
      ${whereClause}
      ORDER BY p.product_cd, c.component_cd`,
      params,
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 新規登録
router.post("/create", async (req, res) => {
  try {
    const { product_id, component_id, quantity, unit_price, note } = req.body;

    await db.query(
      "INSERT INTO bom (product_id, component_id, quantity, unit_price, note) VALUES (?, ?, ?, ?, ?)",
      [product_id, component_id, quantity, unit_price, note],
    );

    res.json({ success: true, message: "登録しました" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 更新
router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { product_id, component_id, quantity, unit_price, note } = req.body;

    await db.query(
      "UPDATE bom SET product_id = ?, component_id = ?, quantity = ?, unit_price = ?, note = ? WHERE id = ?",
      [product_id, component_id, quantity, unit_price, note, id],
    );

    res.json({ success: true, message: "更新しました" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 削除
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM bom WHERE id = ?", [id]);
    res.json({ success: true, message: "削除しました" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 製品選択肢
router.get("/product-options", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, product_cd, product_name FROM products ORDER BY product_cd",
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 部品選択肢
router.get("/component-options", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, component_cd, component_name FROM components ORDER BY component_cd",
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// BOM展開ツリー
router.get("/tree/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    // 再帰CTE (Common Table Expression) で階層を取得
    const [rows] = await db.query(
      `
      WITH RECURSIVE bom_tree AS (
        -- 最初のレベル
        SELECT
          b.id, b.component_id, c.component_name, b.quantity, b.unit_price,
          1 AS level, CAST(c.component_name AS CHAR(1000)) AS path
        FROM bom b
        JOIN components c ON b.component_id = c.id
        WHERE b.product_id = ?

        UNION ALL

        -- 子のレベル
        SELECT
          b2.id, b2.component_id, c2.component_name, b2.quantity, b2.unit_price,
          bt.level + 1, CONCAT(bt.path, ' > ', c2.component_name)
        FROM bom b2
        JOIN components c2 ON b2.component_id = c2.id
        JOIN bom_tree bt ON b2.product_id = bt.component_id
      )

      SELECT * FROM bom_tree ORDER BY path;
    `,
      [productId],
    );

    // ツリー構造に変換
    const buildTree = (data, level = 1, parent = null) => {
      const result = [];
      const filtered = data.filter(
        (item) => item.level === level && (parent === null || item.path.startsWith(parent.path)),
      );

      for (const item of filtered) {
        const node = {
          id: item.id,
          component_id: item.component_id,
          component_name: item.component_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          level: item.level,
          children: buildTree(data, level + 1, item),
        };
        result.push(node);
      }

      return result;
    };

    res.json(buildTree(rows));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 逆展開（この部品がどの製品に使われているか）
router.get("/tree/reverse/:componentId", async (req, res) => {
  try {
    const { componentId } = req.params;
    const [rows] = await db.query(
      `
      WITH RECURSIVE used_in AS (
        -- 最初のレベル: この部品が直接使われている製品
        SELECT
          b.id, p.id AS product_id, p.product_name, b.quantity,
          1 AS level, CAST(p.product_name AS CHAR(1000)) AS path
        FROM bom b
        JOIN products p ON b.product_id = p.id
        WHERE b.component_id = ?

        UNION ALL

        -- 次のレベル: その製品がさらに上位の製品の部品になっている
        SELECT
          b2.id, p2.id, p2.product_name, b2.quantity,
          ui.level + 1, CONCAT(ui.path, ' < ', p2.product_name)
        FROM bom b2
        JOIN products p2 ON b2.product_id = p2.id
        JOIN used_in ui ON b2.component_id = ui.product_id
      )

      SELECT * FROM used_in ORDER BY path;
    `,
      [componentId],
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
