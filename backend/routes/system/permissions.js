import express from "express";
import { db } from "../../db/index.js";
import {
  authenticateToken,
  requireAdmin,
  requireEnhancedPermission,
} from "../../middleware/auth.js";

const router = express.Router();

// ========== 基础权限管理 ==========

// 获取所有权限
router.get("/permissions", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [permissions] = await db.query("SELECT * FROM permissions ORDER BY code");
    res.json({ success: true, data: permissions });
  } catch (error) {
    console.error("获取权限列表失败:", error);
    res.status(500).json({ success: false, message: "サーバーエラー" });
  }
});

// 获取角色权限
router.get("/roles/:role/permissions", authenticateToken, requireAdmin, async (req, res) => {
  const { role } = req.params;
  try {
    const [rolePermissions] = await db.query(
      `SELECT p.* FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = ?`,
      [role],
    );
    res.json({ success: true, data: rolePermissions });
  } catch (error) {
    console.error("获取角色权限失败:", error);
    res.status(500).json({ success: false, message: "サーバーエラー" });
  }
});

// 更新角色权限
router.post("/roles/:role/permissions", authenticateToken, requireAdmin, async (req, res) => {
  const { role } = req.params;
  const { permissionIds } = req.body;
  try {
    await db.query("START TRANSACTION");
    await db.query("DELETE FROM role_permissions WHERE role_id = ?", [role]);
    if (permissionIds && permissionIds.length > 0) {
      const values = permissionIds.map((id) => [role, id]);
      await db.query("INSERT INTO role_permissions (role_id, permission_id) VALUES ?", [values]);
    }
    await db.query("COMMIT");
    res.json({ success: true, message: "権限が更新されました" });
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("更新角色权限失败:", error);
    res.status(500).json({ success: false, message: "サーバーエラー" });
  }
});

// ========== 页面权限管理 ==========

// 获取所有页面权限配置
router.get(
  "/page-permissions",
  authenticateToken,
  requireEnhancedPermission("admin:permission-manage"),
  async (req, res) => {
    try {
      const [pagePermissions] = await db.query(`
      SELECT pp.*, p.name as permission_name
      FROM page_permissions pp
      LEFT JOIN permissions p ON pp.required_permission = p.code
      WHERE pp.is_active = TRUE
      ORDER BY pp.module_name, pp.page_name
    `);
      res.json({ success: true, data: pagePermissions });
    } catch (error) {
      console.error("获取页面权限失败:", error);
      res.status(500).json({ success: false, message: "サーバーエラー" });
    }
  },
);

// 获取按模块分组的页面权限
router.get(
  "/page-permissions/grouped",
  authenticateToken,
  requireEnhancedPermission("admin:permission-manage"),
  async (req, res) => {
    try {
      const [pagePermissions] = await db.query(`
      SELECT pp.*, p.name as permission_name
      FROM page_permissions pp
      LEFT JOIN permissions p ON pp.required_permission = p.code
      WHERE pp.is_active = TRUE
      ORDER BY pp.module_name, pp.page_name
    `);

      // 按模块分组
      const grouped = {};
      pagePermissions.forEach((page) => {
        if (!grouped[page.module_name]) {
          grouped[page.module_name] = [];
        }
        grouped[page.module_name].push(page);
      });

      res.json({ success: true, data: grouped });
    } catch (error) {
      console.error("获取分组页面权限失败:", error);
      res.status(500).json({ success: false, message: "サーバーエラー" });
    }
  },
);

// 更新页面权限配置
router.put(
  "/page-permissions/:id",
  authenticateToken,
  requireEnhancedPermission("admin:permission-manage"),
  async (req, res) => {
    const { id } = req.params;
    const { required_permission, description } = req.body;

    try {
      await db.query(
        "UPDATE page_permissions SET required_permission = ?, description = ?, updated_at = NOW() WHERE id = ?",
        [required_permission, description, id],
      );
      res.json({ success: true, message: "ページ権限が更新されました" });
    } catch (error) {
      console.error("更新页面权限失败:", error);
      res.status(500).json({ success: false, message: "サーバーエラー" });
    }
  },
);

// 批量更新页面权限配置
router.post(
  "/page-permissions/batch-update",
  authenticateToken,
  requireEnhancedPermission("admin:permission-manage"),
  async (req, res) => {
    const { pagePermissions } = req.body;

    try {
      await db.query("START TRANSACTION");

      for (const page of pagePermissions) {
        await db.query(
          "UPDATE page_permissions SET required_permission = ?, description = ?, updated_at = NOW() WHERE id = ?",
          [page.required_permission, page.description, page.id],
        );
      }

      await db.query("COMMIT");
      res.json({ success: true, message: "ページ権限が一括更新されました" });
    } catch (error) {
      await db.query("ROLLBACK");
      console.error("批量更新页面权限失败:", error);
      res.status(500).json({ success: false, message: "サーバーエラー" });
    }
  },
);

// ========== 用户特殊权限管理 ==========

// 获取所有用户列表（用于权限分配）
router.get(
  "/users",
  authenticateToken,
  // requireEnhancedPermission("admin:user-manage"), // 暂时注释掉以便调试
  async (req, res) => {
    try {
      console.log("获取用户列表API被调用");
      const [users] = await db.query(`
      SELECT id, username, email, role, name, status as is_active
      FROM users
      WHERE status = 1
      ORDER BY username
    `);
      console.log("查询到的用户数量:", users.length);
      console.log("用户数据:", users);
      res.json({ success: true, data: users });
    } catch (error) {
      console.error("获取用户列表失败:", error);
      res.status(500).json({ success: false, message: "サーバーエラー" });
    }
  },
);

// 获取用户的特殊权限
router.get(
  "/users/:userId/permissions",
  authenticateToken,
  // requireEnhancedPermission("admin:user-manage"), // 暂时注释掉以便调试
  async (req, res) => {
    const { userId } = req.params;
    try {
      console.log("获取用户权限API被调用，用户ID:", userId);
      const [userPermissions] = await db.query(
        `
      SELECT p.*, up.granted_by, up.granted_reason, up.expires_at, up.created_at as granted_at,
             u.username as granted_by_username
      FROM user_permissions up
      JOIN permissions p ON up.permission_id = p.id
      LEFT JOIN users u ON up.granted_by = u.id
      WHERE up.user_id = ? AND up.is_active = TRUE
      ORDER BY p.code
    `,
        [userId],
      );
      console.log("查询到的用户权限数量:", userPermissions.length);
      console.log("用户权限数据:", userPermissions);
      res.json({ success: true, data: userPermissions });
    } catch (error) {
      console.error("获取用户权限失败:", error);
      res.status(500).json({ success: false, message: "サーバーエラー" });
    }
  },
);

// 为用户添加特殊权限
router.post(
  "/users/:userId/permissions",
  authenticateToken,
  requireEnhancedPermission("admin:user-manage"),
  async (req, res) => {
    const { userId } = req.params;
    const { permissionIds, reason, expiresAt } = req.body;

    try {
      await db.query("START TRANSACTION");

      for (const permissionId of permissionIds) {
        // 检查是否已存在该权限
        const [existing] = await db.query(
          "SELECT id FROM user_permissions WHERE user_id = ? AND permission_id = ?",
          [userId, permissionId],
        );

        if (existing.length === 0) {
          await db.query(
            "INSERT INTO user_permissions (user_id, permission_id, granted_by, granted_reason, expires_at) VALUES (?, ?, ?, ?, ?)",
            [userId, permissionId, req.user.id, reason, expiresAt],
          );
        } else {
          // 更新现有权限
          await db.query(
            "UPDATE user_permissions SET granted_by = ?, granted_reason = ?, expires_at = ?, is_active = TRUE, updated_at = NOW() WHERE id = ?",
            [req.user.id, reason, expiresAt, existing[0].id],
          );
        }
      }

      await db.query("COMMIT");
      res.json({ success: true, message: "ユーザー権限が追加されました" });
    } catch (error) {
      await db.query("ROLLBACK");
      console.error("添加用户权限失败:", error);
      res.status(500).json({ success: false, message: "サーバーエラー" });
    }
  },
);

// 撤销用户特殊权限
router.delete(
  "/users/:userId/permissions/:permissionId",
  authenticateToken,
  requireEnhancedPermission("admin:user-manage"),
  async (req, res) => {
    const { userId, permissionId } = req.params;

    try {
      await db.query(
        "UPDATE user_permissions SET is_active = FALSE, updated_at = NOW() WHERE user_id = ? AND permission_id = ?",
        [userId, permissionId],
      );
      res.json({ success: true, message: "ユーザー権限が撤回されました" });
    } catch (error) {
      console.error("撤销用户权限失败:", error);
      res.status(500).json({ success: false, message: "サーバーエラー" });
    }
  },
);

// ========== 权限模板管理 ==========

// 获取所有权限模板
router.get(
  "/templates",
  authenticateToken,
  requireEnhancedPermission("admin:permission-manage"),
  async (req, res) => {
    try {
      const [templates] = await db.query(`
      SELECT pt.*, u.username as created_by_username
      FROM permission_templates pt
      LEFT JOIN users u ON pt.created_by = u.id
      WHERE pt.is_active = TRUE
      ORDER BY pt.template_name
    `);
      res.json({ success: true, data: templates });
    } catch (error) {
      console.error("获取权限模板失败:", error);
      res.status(500).json({ success: false, message: "サーバーエラー" });
    }
  },
);

// 创建权限模板
router.post(
  "/templates",
  authenticateToken,
  requireEnhancedPermission("admin:permission-manage"),
  async (req, res) => {
    const { template_name, template_description, permission_codes } = req.body;

    try {
      await db.query(
        "INSERT INTO permission_templates (template_name, template_description, template_data, created_by) VALUES (?, ?, ?, ?)",
        [template_name, template_description, JSON.stringify(permission_codes), req.user.id],
      );
      res.json({ success: true, message: "権限テンプレートが作成されました" });
    } catch (error) {
      console.error("创建权限模板失败:", error);
      res.status(500).json({ success: false, message: "サーバーエラー" });
    }
  },
);

// 更新权限模板
router.put(
  "/templates/:id",
  authenticateToken,
  requireEnhancedPermission("admin:permission-manage"),
  async (req, res) => {
    const { id } = req.params;
    const { template_name, template_description, permission_codes } = req.body;

    try {
      await db.query(
        "UPDATE permission_templates SET template_name = ?, template_description = ?, template_data = ?, updated_at = NOW() WHERE id = ?",
        [template_name, template_description, JSON.stringify(permission_codes), id],
      );
      res.json({ success: true, message: "権限テンプレートが更新されました" });
    } catch (error) {
      console.error("更新权限模板失败:", error);
      res.status(500).json({ success: false, message: "サーバーエラー" });
    }
  },
);

// 删除权限模板
router.delete(
  "/templates/:id",
  authenticateToken,
  requireEnhancedPermission("admin:permission-manage"),
  async (req, res) => {
    const { id } = req.params;

    try {
      await db.query("UPDATE permission_templates SET is_active = FALSE WHERE id = ?", [id]);
      res.json({ success: true, message: "権限テンプレートが削除されました" });
    } catch (error) {
      console.error("删除权限模板失败:", error);
      res.status(500).json({ success: false, message: "サーバーエラー" });
    }
  },
);

// 应用权限模板到角色
router.post(
  "/templates/:id/apply-to-role/:role",
  authenticateToken,
  requireEnhancedPermission("admin:permission-manage"),
  async (req, res) => {
    const { id, role } = req.params;

    try {
      // 获取模板数据
      const [template] = await db.query(
        "SELECT template_data FROM permission_templates WHERE id = ? AND is_active = TRUE",
        [id],
      );
      if (template.length === 0) {
        return res.status(404).json({ success: false, message: "テンプレートが見つかりません" });
      }

      const permissionCodes = JSON.parse(template[0].template_data);

      // 获取权限ID
      const [permissions] = await db.query("SELECT id FROM permissions WHERE code IN (?)", [
        permissionCodes,
      ]);
      const permissionIds = permissions.map((p) => p.id);

      await db.query("START TRANSACTION");

      // 删除现有权限
      await db.query("DELETE FROM role_permissions WHERE role_id = ?", [role]);

      // 添加新权限
      if (permissionIds.length > 0) {
        const values = permissionIds.map((id) => [role, id]);
        await db.query("INSERT INTO role_permissions (role_id, permission_id) VALUES ?", [values]);
      }

      await db.query("COMMIT");
      res.json({ success: true, message: "テンプレートがロールに適用されました" });
    } catch (error) {
      await db.query("ROLLBACK");
      console.error("应用权限模板失败:", error);
      res.status(500).json({ success: false, message: "サーバーエラー" });
    }
  },
);

// ========== 权限统计和分析 ==========

// 获取权限使用统计
router.get(
  "/statistics",
  authenticateToken,
  requireEnhancedPermission("admin:permission-manage"),
  async (req, res) => {
    try {
      // 角色权限统计
      const [roleStats] = await db.query(`
      SELECT rp.role_id, COUNT(*) as permission_count
      FROM role_permissions rp
      GROUP BY rp.role_id
      ORDER BY permission_count DESC
    `);

      // 用户特殊权限统计
      const [userStats] = await db.query(`
      SELECT COUNT(*) as total_user_permissions,
             COUNT(DISTINCT user_id) as users_with_special_permissions
      FROM user_permissions
      WHERE is_active = TRUE
    `);

      // 权限使用频率统计
      const [permissionStats] = await db.query(`
      SELECT p.code, p.name,
             COUNT(rp.role_id) as role_usage_count,
             COUNT(up.user_id) as user_usage_count
      FROM permissions p
      LEFT JOIN role_permissions rp ON p.id = rp.permission_id
      LEFT JOIN user_permissions up ON p.id = up.permission_id AND up.is_active = TRUE
      GROUP BY p.id, p.code, p.name
      ORDER BY (COUNT(rp.role_id) + COUNT(up.user_id)) DESC
    `);

      res.json({
        success: true,
        data: {
          roleStats,
          userStats: userStats[0],
          permissionStats,
        },
      });
    } catch (error) {
      console.error("获取权限统计失败:", error);
      res.status(500).json({ success: false, message: "サーバーエラー" });
    }
  },
);

export default router;
