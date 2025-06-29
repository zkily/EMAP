import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "smart_emap",
  charset: "utf8mb4",
};

// 样本权限数据
const samplePermissions = [
  // 订单管理权限
  { code: "order:view", name: "受注閲覧", description: "受注情報の閲覧権限" },
  { code: "order:create", name: "受注作成", description: "新規受注の作成権限" },
  { code: "order:edit", name: "受注編集", description: "受注情報の編集権限" },
  { code: "order:delete", name: "受注削除", description: "受注の削除権限" },
  { code: "order:approve", name: "受注承認", description: "受注の承認権限" },
  { code: "order:export", name: "受注エクスポート", description: "受注データのエクスポート権限" },

  // 生产计划权限
  { code: "plan:view", name: "生産計画閲覧", description: "生産計画の閲覧権限" },
  { code: "plan:create", name: "生産計画作成", description: "生産計画の作成権限" },
  { code: "plan:edit", name: "生産計画編集", description: "生産計画の編集権限" },
  { code: "plan:delete", name: "生産計画削除", description: "生産計画の削除権限" },
  { code: "plan:schedule", name: "生産スケジュール", description: "生産スケジュールの管理権限" },
  { code: "plan:optimize", name: "計画最適化", description: "生産計画の最適化権限" },

  // 出货管理权限
  { code: "shipping:view", name: "出荷閲覧", description: "出荷情報の閲覧権限" },
  { code: "shipping:create", name: "出荷作成", description: "出荷指示の作成権限" },
  { code: "shipping:edit", name: "出荷編集", description: "出荷情報の編集権限" },
  { code: "shipping:confirm", name: "出荷確認", description: "出荷の確認権限" },
  { code: "shipping:track", name: "配送追跡", description: "配送状況の追跡権限" },

  // 系统管理权限
  { code: "system:users", name: "ユーザー管理", description: "ユーザーアカウントの管理権限" },
  { code: "system:roles", name: "ロール管理", description: "ロールと権限の管理権限" },
  { code: "system:settings", name: "システム設定", description: "システム設定の管理権限" },
  { code: "system:backup", name: "バックアップ", description: "データバックアップの権限" },
  { code: "system:logs", name: "ログ閲覧", description: "システムログの閲覧権限" },

  // 数据操作权限
  { code: "data:import", name: "データインポート", description: "データのインポート権限" },
  { code: "data:export", name: "データエクスポート", description: "データのエクスポート権限" },
  { code: "data:analyze", name: "データ分析", description: "データ分析機能の使用権限" },

  // 页面访问权限
  { code: "page:dashboard", name: "ダッシュボード", description: "ダッシュボードページの閲覧権限" },
  { code: "page:reports", name: "レポート", description: "レポートページの閲覧権限" },
  { code: "page:analytics", name: "分析", description: "分析ページの閲覧権限" },

  // 管理员功能权限
  { code: "admin:all", name: "管理者権限", description: "全ての管理者機能へのアクセス権限" },
  { code: "admin:audit", name: "監査ログ", description: "監査ログの閲覧権限" },
  { code: "admin:maintenance", name: "メンテナンス", description: "システムメンテナンス権限" },
];

// 样本页面权限数据
const samplePagePermissions = [
  // 订单管理模块
  {
    page_code: "order_list",
    page_name: "受注一覧",
    page_path: "/order/list",
    module_name: "order",
    required_permission: "order:view",
    description: "受注一覧ページ",
  },
  {
    page_code: "order_create",
    page_name: "受注作成",
    page_path: "/order/create",
    module_name: "order",
    required_permission: "order:create",
    description: "受注作成ページ",
  },
  {
    page_code: "order_edit",
    page_name: "受注編集",
    page_path: "/order/edit/:id",
    module_name: "order",
    required_permission: "order:edit",
    description: "受注編集ページ",
  },
  {
    page_code: "order_detail",
    page_name: "受注詳細",
    page_path: "/order/detail/:id",
    module_name: "order",
    required_permission: "order:view",
    description: "受注詳細ページ",
  },

  // 生产计划模块
  {
    page_code: "plan_dashboard",
    page_name: "生産計画ダッシュボード",
    page_path: "/plan/dashboard",
    module_name: "plan",
    required_permission: "plan:view",
    description: "生産計画ダッシュボード",
  },
  {
    page_code: "plan_create",
    page_name: "生産計画作成",
    page_path: "/plan/create",
    module_name: "plan",
    required_permission: "plan:create",
    description: "生産計画作成ページ",
  },
  {
    page_code: "plan_schedule",
    page_name: "生産スケジュール",
    page_path: "/plan/schedule",
    module_name: "plan",
    required_permission: "plan:schedule",
    description: "生産スケジュール管理ページ",
  },

  // 出货管理模块
  {
    page_code: "shipping_list",
    page_name: "出荷一覧",
    page_path: "/shipping/list",
    module_name: "shipping",
    required_permission: "shipping:view",
    description: "出荷一覧ページ",
  },
  {
    page_code: "shipping_create",
    page_name: "出荷指示作成",
    page_path: "/shipping/create",
    module_name: "shipping",
    required_permission: "shipping:create",
    description: "出荷指示作成ページ",
  },
  {
    page_code: "shipping_tracking",
    page_name: "配送追跡",
    page_path: "/shipping/tracking",
    module_name: "shipping",
    required_permission: "shipping:track",
    description: "配送追跡ページ",
  },

  // 系统管理模块
  {
    page_code: "system_users",
    page_name: "ユーザー管理",
    page_path: "/system/users",
    module_name: "system",
    required_permission: "system:users",
    description: "ユーザー管理ページ",
  },
  {
    page_code: "system_roles",
    page_name: "ロール管理",
    page_path: "/system/roles",
    module_name: "system",
    required_permission: "system:roles",
    description: "ロール管理ページ",
  },
  {
    page_code: "system_settings",
    page_name: "システム設定",
    page_path: "/system/settings",
    module_name: "system",
    required_permission: "system:settings",
    description: "システム設定ページ",
  },
  {
    page_code: "system_logs",
    page_name: "ログ管理",
    page_path: "/system/logs",
    module_name: "system",
    required_permission: "system:logs",
    description: "ログ管理ページ",
  },

  // 人员管理模块
  {
    page_code: "staff_list",
    page_name: "人員一覧",
    page_path: "/staff/list",
    module_name: "staff",
    required_permission: "system:users",
    description: "人員一覧ページ",
  },
  {
    page_code: "staff_schedule",
    page_name: "人員スケジュール",
    page_path: "/staff/schedule",
    module_name: "staff",
    required_permission: "plan:schedule",
    description: "人員スケジュール管理ページ",
  },

  // 主数据管理模块
  {
    page_code: "master_products",
    page_name: "商品マスタ",
    page_path: "/master/products",
    module_name: "master",
    required_permission: "data:import",
    description: "商品マスタ管理ページ",
  },
  {
    page_code: "master_customers",
    page_name: "顧客マスタ",
    page_path: "/master/customers",
    module_name: "master",
    required_permission: "data:import",
    description: "顧客マスタ管理ページ",
  },
];

// 角色权限配置
const rolePermissions = {
  admin: [
    // 管理员拥有所有权限
    "order:view",
    "order:create",
    "order:edit",
    "order:delete",
    "order:approve",
    "order:export",
    "plan:view",
    "plan:create",
    "plan:edit",
    "plan:delete",
    "plan:schedule",
    "plan:optimize",
    "shipping:view",
    "shipping:create",
    "shipping:edit",
    "shipping:confirm",
    "shipping:track",
    "system:users",
    "system:roles",
    "system:settings",
    "system:backup",
    "system:logs",
    "data:import",
    "data:export",
    "data:analyze",
    "page:dashboard",
    "page:reports",
    "page:analytics",
    "admin:all",
    "admin:audit",
    "admin:maintenance",
  ],
  manager: [
    // 经理权限
    "order:view",
    "order:create",
    "order:edit",
    "order:approve",
    "order:export",
    "plan:view",
    "plan:create",
    "plan:edit",
    "plan:schedule",
    "plan:optimize",
    "shipping:view",
    "shipping:create",
    "shipping:edit",
    "shipping:confirm",
    "shipping:track",
    "data:export",
    "data:analyze",
    "page:dashboard",
    "page:reports",
    "page:analytics",
  ],
  staff: [
    // 普通员工权限（原user权限）
    "order:view",
    "order:create",
    "order:edit",
    "plan:view",
    "plan:create",
    "shipping:view",
    "shipping:create",
    "page:dashboard",
  ],
};

// 样本权限模板
const sampleTemplates = [
  {
    template_name: "受注管理者テンプレート",
    template_description: "受注業務を担当する管理者向けの権限セット",
    permission_codes: [
      "order:view",
      "order:create",
      "order:edit",
      "order:approve",
      "order:export",
      "page:dashboard",
      "page:reports",
    ],
  },
  {
    template_name: "生産計画担当者テンプレート",
    template_description: "生産計画業務を担当する職員向けの権限セット",
    permission_codes: [
      "plan:view",
      "plan:create",
      "plan:edit",
      "plan:schedule",
      "order:view",
      "page:dashboard",
    ],
  },
  {
    template_name: "出荷担当者テンプレート",
    template_description: "出荷業務を担当する職員向けの権限セット",
    permission_codes: [
      "shipping:view",
      "shipping:create",
      "shipping:edit",
      "shipping:confirm",
      "shipping:track",
      "order:view",
      "page:dashboard",
    ],
  },
  {
    template_name: "データアナリストテンプレート",
    template_description: "データ分析を担当する職員向けの権限セット",
    permission_codes: [
      "data:export",
      "data:analyze",
      "page:dashboard",
      "page:reports",
      "page:analytics",
      "order:view",
      "plan:view",
      "shipping:view",
    ],
  },
  {
    template_name: "新入社員テンプレート",
    template_description: "新入社員向けの基本権限セット",
    permission_codes: ["order:view", "plan:view", "shipping:view", "page:dashboard"],
  },
];

// 样本用户数据（用于测试用户特殊权限）
const sampleUsers = [
  {
    username: "admin",
    first_name: "管理者",
    last_name: "システム",
    email: "admin@example.com",
    role: "admin",
  },
  {
    username: "manager1",
    first_name: "田中",
    last_name: "太郎",
    email: "tanaka@example.com",
    role: "manager",
  },
  {
    username: "manager2",
    first_name: "佐藤",
    last_name: "花子",
    email: "sato@example.com",
    role: "manager",
  },
  {
    username: "user1",
    first_name: "山田",
    last_name: "次郎",
    email: "yamada@example.com",
    role: "staff",
  },
  {
    username: "user2",
    first_name: "鈴木",
    last_name: "美咲",
    email: "suzuki@example.com",
    role: "staff",
  },
  {
    username: "user3",
    first_name: "高橋",
    last_name: "健一",
    email: "takahashi@example.com",
    role: "staff",
  },
  {
    username: "guest1",
    first_name: "ゲスト",
    last_name: "ユーザー",
    email: "guest@example.com",
    role: "staff",
  },
];

// 样本用户特殊权限（给部分用户额外权限）
const sampleUserPermissions = [
  // 给user1额外的数据导出权限
  {
    username: "user1",
    permission_code: "data:export",
    reason: "レポート作成業務のため",
    expires_at: null,
  },
  // 给user2临时的订单删除权限
  {
    username: "user2",
    permission_code: "order:delete",
    reason: "データ整理作業のため",
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  }, // 30天后过期
  // 给manager1系统设置权限
  {
    username: "manager1",
    permission_code: "system:settings",
    reason: "部門システム管理者として",
    expires_at: null,
  },
  // 给user3临时的生产计划优化权限
  {
    username: "user3",
    permission_code: "plan:optimize",
    reason: "生産効率改善プロジェクトのため",
    expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
  }, // 60天后过期
];

async function insertSampleData() {
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);
    console.log("数据库连接成功");

    // 1. 插入样本权限数据
    console.log("插入样本权限数据...");
    for (const permission of samplePermissions) {
      try {
        await connection.execute(
          "INSERT IGNORE INTO permissions (code, name, description) VALUES (?, ?, ?)",
          [permission.code, permission.name, permission.description],
        );
      } catch (error) {
        console.log(`权限 ${permission.code} 已存在，跳过`);
      }
    }

    // 2. 插入样本用户数据
    console.log("插入样本用户数据...");
    for (const user of sampleUsers) {
      try {
        await connection.execute(
          "INSERT IGNORE INTO users (username, first_name, last_name, email, role, password) VALUES (?, ?, ?, ?, ?, ?)",
          [
            user.username,
            user.first_name,
            user.last_name,
            user.email,
            user.role,
            "$2b$10$defaulthash",
          ], // 使用默认密码hash
        );
      } catch (error) {
        console.log(`用户 ${user.username} 已存在，跳过`);
      }
    }

    // 3. 插入页面权限数据
    console.log("插入页面权限数据...");
    for (const pagePermission of samplePagePermissions) {
      try {
        await connection.execute(
          "INSERT IGNORE INTO page_permissions (page_code, page_name, page_path, module_name, required_permission, description) VALUES (?, ?, ?, ?, ?, ?)",
          [
            pagePermission.page_code,
            pagePermission.page_name,
            pagePermission.page_path,
            pagePermission.module_name,
            pagePermission.required_permission,
            pagePermission.description,
          ],
        );
      } catch (error) {
        console.log(`页面权限 ${pagePermission.page_code} 已存在，跳过`);
      }
    }

    // 4. 配置角色权限
    console.log("配置角色权限...");
    for (const [role, permissions] of Object.entries(rolePermissions)) {
      // 先清除该角色的现有权限
      await connection.execute("DELETE FROM role_permissions WHERE role_id = ?", [role]);

      // 插入新的权限配置
      for (const permissionCode of permissions) {
        try {
          const [permissionRows] = await connection.execute(
            "SELECT id FROM permissions WHERE code = ?",
            [permissionCode],
          );

          if (permissionRows.length > 0) {
            await connection.execute(
              "INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
              [role, permissionRows[0].id],
            );
          }
        } catch (error) {
          console.log(`配置角色权限失败: ${role} - ${permissionCode}`);
        }
      }
    }

    // 5. 插入权限模板
    console.log("插入权限模板...");
    // 获取admin用户ID作为创建者
    const [adminUsers] = await connection.execute("SELECT id FROM users WHERE username = ?", [
      "admin",
    ]);
    const adminId = adminUsers.length > 0 ? adminUsers[0].id : 1;

    for (const template of sampleTemplates) {
      try {
        await connection.execute(
          "INSERT IGNORE INTO permission_templates (template_name, template_description, template_data, created_by) VALUES (?, ?, ?, ?)",
          [
            template.template_name,
            template.template_description,
            JSON.stringify(template.permission_codes),
            adminId,
          ],
        );
      } catch (error) {
        console.log(`模板 ${template.template_name} 已存在，跳过`);
      }
    }

    // 6. 插入用户特殊权限
    console.log("插入用户特殊权限...");
    for (const userPerm of sampleUserPermissions) {
      try {
        // 获取用户ID
        const [userRows] = await connection.execute("SELECT id FROM users WHERE username = ?", [
          userPerm.username,
        ]);
        if (userRows.length === 0) continue;

        // 获取权限ID
        const [permRows] = await connection.execute("SELECT id FROM permissions WHERE code = ?", [
          userPerm.permission_code,
        ]);
        if (permRows.length === 0) continue;

        await connection.execute(
          "INSERT IGNORE INTO user_permissions (user_id, permission_id, granted_by, granted_reason, expires_at) VALUES (?, ?, ?, ?, ?)",
          [userRows[0].id, permRows[0].id, adminId, userPerm.reason, userPerm.expires_at],
        );
      } catch (error) {
        console.log(`用户特殊权限插入失败: ${userPerm.username} - ${userPerm.permission_code}`);
      }
    }

    console.log("样本数据插入完成！");
    console.log("\n=== 测试账户信息 ===");
    console.log("管理员: admin / password (拥有所有权限)");
    console.log("经理1: manager1 / password (管理者权限 + 系统设置权限)");
    console.log("经理2: manager2 / password (管理者权限)");
    console.log("用户1: user1 / password (普通用户权限 + 数据导出权限)");
    console.log("用户2: user2 / password (普通用户权限 + 临时订单删除权限)");
    console.log("用户3: user3 / password (普通用户权限 + 临时生产计划优化权限)");
    console.log("访客: guest1 / password (只读权限)");
    console.log("\n请使用这些账户测试不同的权限功能！");
  } catch (error) {
    console.error("插入样本数据时发生错误:", error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 清理样本数据的函数
async function clearSampleData() {
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);
    console.log("数据库连接成功");

    console.log("清理样本数据...");

    // 按依赖关系逆序删除
    await connection.execute("DELETE FROM user_permissions");
    await connection.execute("DELETE FROM permission_templates");
    await connection.execute("DELETE FROM role_permissions");
    await connection.execute("DELETE FROM page_permissions");
    await connection.execute("DELETE FROM users WHERE username IN (?, ?, ?, ?, ?, ?, ?)", [
      "admin",
      "manager1",
      "manager2",
      "user1",
      "user2",
      "user3",
      "guest1",
    ]);
    await connection.execute(
      "DELETE FROM permissions WHERE code LIKE ? OR code LIKE ? OR code LIKE ? OR code LIKE ? OR code LIKE ? OR code LIKE ?",
      ["order:%", "plan:%", "shipping:%", "system:%", "data:%", "page:%", "admin:%"],
    );

    console.log("样本数据清理完成！");
  } catch (error) {
    console.error("清理样本数据时发生错误:", error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 命令行参数处理
const command = process.argv[2];

if (command === "insert") {
  insertSampleData();
} else if (command === "clear") {
  clearSampleData();
} else {
  console.log("使用方法:");
  console.log("  node permission-sample-data.js insert  # 插入样本数据");
  console.log("  node permission-sample-data.js clear   # 清理样本数据");
}

export { insertSampleData, clearSampleData };
