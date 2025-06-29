import mysql from "mysql2/promise";
import bcrypt from "bcrypt";

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "smart_emap",
  charset: "utf8mb4",
};

async function insertDemoData() {
  let connection;

  try {
    console.log("📦 ピッキング履歴デモデータ挿入開始...\n");

    // 创建数据库连接
    connection = await mysql.createConnection(dbConfig);
    console.log("✅ データベース接続成功");

    // 插入演示用户数据（如果不存在）
    console.log("👥 ユーザーデータ挿入中...");
    const hashedPassword = await bcrypt.hash("password123", 10);

    const userInsertQuery = `
      INSERT IGNORE INTO users (username, password, name, role, status) VALUES
      ('picker001', ?, '田中太郎', 'picker', 1),
      ('picker002', ?, '佐藤花子', 'picker', 1),
      ('picker003', ?, '鈴木一郎', 'picker', 1),
      ('picker004', ?, '高橋美咲', 'picker', 1)
    `;

    await connection.execute(userInsertQuery, [
      hashedPassword,
      hashedPassword,
      hashedPassword,
      hashedPassword,
    ]);
    console.log("✅ ユーザーデータ挿入完了");

    // 先清理现有的演示数据（可选）
    console.log("🧹 既存のデモデータクリア中...");
    await connection.execute('DELETE FROM picking_tasks WHERE picking_id LIKE "PKG2024%"');
    console.log("✅ クリア完了");

    // 插入ピッキング任务数据
    console.log("📋 ピッキングタスクデータ挿入中...");

    const taskData = [
      // 今日完成的任务
      [
        "PKG20241201001",
        "SHP001-001",
        "PAL001",
        "P001",
        "製品A",
        10,
        10,
        "A-01",
        "A-01-01",
        1,
        "completed",
        "picker001",
        1,
        "2024-12-01 08:30:00",
        "2024-12-01 08:45:00",
        "正常完了",
        "admin",
        "2024-12-01 08:00:00",
      ],
      [
        "PKG20241201002",
        "SHP001-002",
        "PAL001",
        "P002",
        "製品B",
        5,
        5,
        "A-01",
        "A-01-02",
        1,
        "completed",
        "picker001",
        2,
        "2024-12-01 08:45:00",
        "2024-12-01 09:00:00",
        "正常完了",
        "admin",
        "2024-12-01 08:00:00",
      ],
      [
        "PKG20241201003",
        "SHP002-001",
        "PAL002",
        "P003",
        "製品C",
        8,
        6,
        "B-02",
        "B-02-01",
        2,
        "completed",
        "picker002",
        1,
        "2024-12-01 09:00:00",
        "2024-12-01 09:20:00",
        "正常完了",
        "admin",
        "2024-12-01 08:30:00",
      ],
      [
        "PKG20241201004",
        "SHP003-001",
        "PAL003",
        "P004",
        "製品D",
        12,
        12,
        "C-03",
        "C-03-01",
        2,
        "completed",
        "picker003",
        1,
        "2024-12-01 09:30:00",
        "2024-12-01 09:50:00",
        "正常完了",
        "admin",
        "2024-12-01 09:00:00",
      ],

      // 昨日完成的任务
      [
        "PKG20241130001",
        "SHP005-001",
        "PAL005",
        "P001",
        "製品A",
        20,
        20,
        "A-01",
        "A-01-01",
        1,
        "completed",
        "picker001",
        1,
        "2024-11-30 14:00:00",
        "2024-11-30 14:25:00",
        "正常完了",
        "admin",
        "2024-11-30 13:30:00",
      ],
      [
        "PKG20241130002",
        "SHP006-001",
        "PAL006",
        "P002",
        "製品B",
        8,
        8,
        "A-01",
        "A-01-02",
        2,
        "completed",
        "picker002",
        1,
        "2024-11-30 14:30:00",
        "2024-11-30 14:45:00",
        "正常完了",
        "admin",
        "2024-11-30 14:00:00",
      ],
      [
        "PKG20241130003",
        "SHP007-001",
        "PAL007",
        "P003",
        "製品C",
        6,
        6,
        "B-02",
        "B-02-01",
        1,
        "completed",
        "picker003",
        1,
        "2024-11-30 15:00:00",
        "2024-11-30 15:12:00",
        "正常完了",
        "admin",
        "2024-11-30 14:30:00",
      ],

      // 一周前的任务
      [
        "PKG20241125001",
        "SHP009-001",
        "PAL009",
        "P001",
        "製品A",
        25,
        25,
        "A-01",
        "A-01-01",
        1,
        "completed",
        "picker001",
        1,
        "2024-11-25 10:00:00",
        "2024-11-25 10:30:00",
        "正常完了",
        "admin",
        "2024-11-25 09:30:00",
      ],
      [
        "PKG20241125002",
        "SHP010-001",
        "PAL010",
        "P002",
        "製品B",
        12,
        12,
        "A-01",
        "A-01-02",
        2,
        "completed",
        "picker002",
        1,
        "2024-11-25 11:00:00",
        "2024-11-25 11:20:00",
        "正常完了",
        "admin",
        "2024-11-25 10:30:00",
      ],
      [
        "PKG20241125003",
        "SHP011-001",
        "PAL011",
        "P005",
        "製品E",
        18,
        18,
        "D-04",
        "D-04-01",
        1,
        "completed",
        "picker003",
        1,
        "2024-11-25 13:00:00",
        "2024-11-25 13:35:00",
        "正常完了",
        "admin",
        "2024-11-25 12:30:00",
      ],

      // 待機中の任务
      [
        "PKG20241201006",
        "SHP012-001",
        "PAL012",
        "P001",
        "製品A",
        15,
        0,
        "A-01",
        "A-01-01",
        1,
        "pending",
        "picker001",
        1,
        null,
        null,
        null,
        "admin",
        "2024-12-01 10:30:00",
      ],
      [
        "PKG20241201007",
        "SHP013-001",
        "PAL013",
        "P002",
        "製品B",
        10,
        0,
        "A-01",
        "A-01-02",
        2,
        "pending",
        "picker002",
        1,
        null,
        null,
        null,
        "admin",
        "2024-12-01 10:45:00",
      ],
      [
        "PKG20241201008",
        "SHP014-001",
        "PAL014",
        "P003",
        "製品C",
        7,
        0,
        "B-02",
        "B-02-01",
        2,
        "pending",
        "picker003",
        1,
        null,
        null,
        null,
        "admin",
        "2024-12-01 11:00:00",
      ],

      // ピッキング中の任务
      [
        "PKG20241201009",
        "SHP015-001",
        "PAL015",
        "P004",
        "製品D",
        20,
        5,
        "C-03",
        "C-03-01",
        1,
        "picking",
        "picker004",
        1,
        "2024-12-01 11:30:00",
        null,
        "ピッキング進行中",
        "admin",
        "2024-12-01 11:15:00",
      ],
      [
        "PKG20241201010",
        "SHP016-001",
        "PAL016",
        "P005",
        "製品E",
        14,
        8,
        "D-04",
        "D-04-01",
        2,
        "picking",
        "picker001",
        1,
        "2024-12-01 12:00:00",
        null,
        "ピッキング進行中",
        "admin",
        "2024-12-01 11:45:00",
      ],

      // 月初のデータ（月別統計用）
      [
        "PKG20241101001",
        "SHP017-001",
        "PAL017",
        "P001",
        "製品A",
        30,
        30,
        "A-01",
        "A-01-01",
        1,
        "completed",
        "picker001",
        1,
        "2024-11-01 09:00:00",
        "2024-11-01 09:40:00",
        "正常完了",
        "admin",
        "2024-11-01 08:30:00",
      ],
      [
        "PKG20241101002",
        "SHP018-001",
        "PAL018",
        "P002",
        "製品B",
        16,
        16,
        "A-01",
        "A-01-02",
        2,
        "completed",
        "picker002",
        1,
        "2024-11-01 10:00:00",
        "2024-11-01 10:25:00",
        "正常完了",
        "admin",
        "2024-11-01 09:30:00",
      ],

      // 前月のデータ
      [
        "PKG20241015001",
        "SHP020-001",
        "PAL020",
        "P004",
        "製品D",
        18,
        18,
        "C-03",
        "C-03-01",
        2,
        "completed",
        "picker004",
        1,
        "2024-10-15 14:00:00",
        "2024-10-15 14:30:00",
        "正常完了",
        "admin",
        "2024-10-15 13:30:00",
      ],
      [
        "PKG20241015002",
        "SHP021-001",
        "PAL021",
        "P005",
        "製品E",
        24,
        24,
        "D-04",
        "D-04-01",
        1,
        "completed",
        "picker001",
        1,
        "2024-10-15 15:00:00",
        "2024-10-15 15:45:00",
        "正常完了",
        "admin",
        "2024-10-15 14:30:00",
      ],
    ];

    const insertQuery = `
      INSERT INTO picking_tasks (
        picking_id, shipping_no_p, shipping_no, product_cd, product_name,
        confirmed_boxes, picked_quantity, location_cd, shelf_position,
        priority, status, picker_id, pallet_sequence,
        start_time, complete_time, remarks, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    for (const task of taskData) {
      await connection.execute(insertQuery, task);
    }

    console.log(`✅ ${taskData.length}件のピッキングタスクデータ挿入完了`);

    // 更新统计信息
    await connection.execute(
      "UPDATE picking_tasks SET updated_at = NOW() WHERE updated_at IS NULL",
    );
    console.log("✅ 統計情報更新完了");

    // 显示插入结果
    const [results] = await connection.execute(`
      SELECT
        '挿入完了' as message,
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
        SUM(CASE WHEN status = 'picking' THEN 1 ELSE 0 END) as picking_tasks
      FROM picking_tasks
      WHERE picking_id LIKE 'PKG2024%'
    `);

    console.log("\n📊 挿入結果:");
    console.log(results[0]);
    console.log("\n🎉 デモデータ挿入が完了しました！");
  } catch (error) {
    console.error("❌ エラー:", error.message);
    console.error("スタックトレース:", error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log("🔌 データベース接続を閉じました");
    }
  }
}

// 実行
insertDemoData();
