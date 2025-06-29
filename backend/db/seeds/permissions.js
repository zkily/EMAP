import mysql from "mysql2/promise";

// 创建直接的数据库连接配置，不依赖于 .env 文件
const dbConfig = {
  host: "localhost",
  port: 3306,
  user: "root",
  password: "", // 如需密码，请在此设置
  database: "smart_emap",
};

// 创建数据库连接
const createConnection = async () => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log("数据库连接成功");
    return connection;
  } catch (error) {
    console.error("数据库连接失败:", error.message);
    throw error;
  }
};

const permissions = [
  { code: "order:access", name: "受注管理アクセス", description: "受注管理モジュールへのアクセス" },
  { code: "order:view", name: "受注一覧表示", description: "受注一覧の表示" },
  { code: "order:create", name: "受注登録", description: "新規受注の登録" },
  { code: "order:edit", name: "受注編集", description: "受注情報の編集" },
  { code: "order:delete", name: "受注削除", description: "受注の削除" },
  { code: "order:approve", name: "受注承認", description: "受注の承認" },
  { code: "order:view-price", name: "価格表示", description: "価格情報の表示" },
  { code: "order:view-cost", name: "コスト表示", description: "コスト情報の表示" },
  { code: "plan:access", name: "生産計画アクセス", description: "生産計画モジュールへのアクセス" },
  { code: "plan:view", name: "計画一覧表示", description: "生産計画一覧の表示" },
  { code: "plan:create", name: "計画登録", description: "新規生産計画の登録" },
  { code: "plan:edit", name: "計画編集", description: "生産計画の編集" },
  { code: "plan:delete", name: "計画削除", description: "生産計画の削除" },
  { code: "plan:approve", name: "計画承認", description: "生産計画の承認" },
  {
    code: "system:access",
    name: "システム管理アクセス",
    description: "システム管理モジュールへのアクセス",
  },
  { code: "system:user-manage", name: "ユーザー管理", description: "ユーザーの管理" },
  { code: "system:role-manage", name: "ロール管理", description: "ロールの管理" },
  { code: "system:permission-manage", name: "権限管理", description: "権限の管理" },
];

const rolePermissions = {
  admin: permissions.map((p) => p.code),
  manager: [
    "order:access",
    "order:view",
    "order:create",
    "order:edit",
    "order:approve",
    "order:view-price",
    "plan:access",
    "plan:view",
    "plan:create",
    "plan:edit",
    "plan:approve",
  ],
  user: ["order:access", "order:view", "order:create", "plan:access", "plan:view"],
  guest: ["order:view", "plan:view"],
};

const initPermissions = async () => {
  let connection;
  try {
    console.log("开始初始化权限数据...");
    connection = await createConnection();

    // 删除旧数据
    await connection.query("DELETE FROM role_permissions");
    await connection.query("DELETE FROM permissions");

    // 插入权限数据
    for (const permission of permissions) {
      await connection.query("INSERT INTO permissions (code, name, description) VALUES (?, ?, ?)", [
        permission.code,
        permission.name,
        permission.description,
      ]);
    }

    // 获取所有权限ID映射
    const [allPermissions] = await connection.query("SELECT id, code FROM permissions");
    const permissionMap = {};
    allPermissions.forEach((p) => {
      permissionMap[p.code] = p.id;
    });

    // 插入角色权限关联
    for (const [role, permCodes] of Object.entries(rolePermissions)) {
      for (const code of permCodes) {
        const permissionId = permissionMap[code];
        if (permissionId) {
          await connection.query(
            "INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
            [role, permissionId],
          );
        }
      }
    }

    console.log("权限数据初始化完成!");
  } catch (error) {
    console.error("初始化权限数据失败:", error);
  } finally {
    if (connection) {
      await connection.end();
    }
    process.exit();
  }
};

initPermissions();
