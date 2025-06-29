import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { pool as db } from "../db/connection.js";

dotenv.config();

// JWT認証ミドルウェア
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "アクセストークンが必要です",
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: "トークンが無効です",
      });
    }
    // 如果 JWT 里没有 username，则查数据库补全
    if (!user.username) {
      try {
        const [rows] = await db.query("SELECT username FROM users WHERE id = ?", [user.id]);
        if (rows && rows[0]) {
          user.username = rows[0].username;
        }
      } catch (e) {
        // 查询失败也不影响主流程
      }
    }
    req.user = user;
    next();
  });
};

// 管理者権限検証ミドルウェア
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "認証が必要です",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "管理者権限が必要です",
    });
  }

  next();
};

// ロール権限検証ミドルウェア（複数ロール対応）
export const requireRoles = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "認証が必要です",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "アクセス権限がありません",
      });
    }

    next();
  };
};

// 权限验证中间件
export const requirePermission = (permissionCode) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "認証が必要です",
      });
    }
    try {
      const [rows] = await db.query(
        `SELECT 1 FROM role_permissions rp
         JOIN permissions p ON rp.permission_id = p.id
         WHERE rp.role_id = ? AND p.code = ?`,
        [req.user.role, permissionCode],
      );
      if (rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: "この操作の権限がありません",
        });
      }
      next();
    } catch (error) {
      console.error("权限验证失败:", error);
      res.status(500).json({
        success: false,
        message: "サーバーエラー",
      });
    }
  };
};

// 页面权限检查中间件
export const requirePagePermission = (pageCode) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "認証が必要です",
      });
    }

    try {
      // 管理员拥有所有权限
      if (req.user.role === "admin") {
        return next();
      }

      // 检查页面访问权限配置
      const [pagePermission] = await db.query(
        "SELECT required_permission FROM page_permissions WHERE page_code = ? AND is_active = TRUE",
        [pageCode],
      );

      if (pagePermission.length === 0) {
        return next(); // 页面未配置权限要求，允许访问
      }

      const requiredPermission = pagePermission[0].required_permission;
      if (!requiredPermission) {
        return next(); // 页面未设置必需权限，允许访问
      }

      // 检查角色权限
      const [rolePermissions] = await db.query(
        `SELECT 1 FROM role_permissions rp
         JOIN permissions p ON rp.permission_id = p.id
         WHERE rp.role_id = ? AND p.code = ?`,
        [req.user.role, requiredPermission],
      );

      // 检查用户特殊权限
      const [userPermissions] = await db.query(
        `SELECT 1 FROM user_permissions up
         JOIN permissions p ON up.permission_id = p.id
         WHERE up.user_id = ? AND p.code = ? AND up.is_active = TRUE
         AND (up.expires_at IS NULL OR up.expires_at > NOW())`,
        [req.user.id, requiredPermission],
      );

      if (rolePermissions.length > 0 || userPermissions.length > 0) {
        next();
      } else {
        res.status(403).json({
          success: false,
          message: "このページにアクセスする権限がありません",
        });
      }
    } catch (error) {
      console.error("页面权限验证失败:", error);
      res.status(500).json({
        success: false,
        message: "サーバーエラー",
      });
    }
  };
};

// 增强的权限检查中间件（支持角色权限和用户特殊权限）
export const requireEnhancedPermission = (permissionCode) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "認証が必要です",
      });
    }

    try {
      // 管理员拥有所有权限
      if (req.user.role === "admin") {
        return next();
      }

      // 检查角色权限
      const [rolePermissions] = await db.query(
        `SELECT 1 FROM role_permissions rp
         JOIN permissions p ON rp.permission_id = p.id
         WHERE rp.role_id = ? AND p.code = ?`,
        [req.user.role, permissionCode],
      );

      // 检查用户特殊权限
      const [userPermissions] = await db.query(
        `SELECT 1 FROM user_permissions up
         JOIN permissions p ON up.permission_id = p.id
         WHERE up.user_id = ? AND p.code = ? AND up.is_active = TRUE
         AND (up.expires_at IS NULL OR up.expires_at > NOW())`,
        [req.user.id, permissionCode],
      );

      if (rolePermissions.length > 0 || userPermissions.length > 0) {
        next();
      } else {
        res.status(403).json({
          success: false,
          message: "この操作の権限がありません",
        });
      }
    } catch (error) {
      console.error("权限验证失败:", error);
      res.status(500).json({
        success: false,
        message: "サーバーエラー",
      });
    }
  };
};

// 批量权限检查中间件（用户需要拥有所有指定权限）
export const requireAllPermissions = (permissionCodes) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "認証が必要です",
      });
    }

    try {
      // 管理员拥有所有权限
      if (req.user.role === "admin") {
        return next();
      }

      for (const permissionCode of permissionCodes) {
        // 检查角色权限
        const [rolePermissions] = await db.query(
          `SELECT 1 FROM role_permissions rp
           JOIN permissions p ON rp.permission_id = p.id
           WHERE rp.role_id = ? AND p.code = ?`,
          [req.user.role, permissionCode],
        );

        // 检查用户特殊权限
        const [userPermissions] = await db.query(
          `SELECT 1 FROM user_permissions up
           JOIN permissions p ON up.permission_id = p.id
           WHERE up.user_id = ? AND p.code = ? AND up.is_active = TRUE
           AND (up.expires_at IS NULL OR up.expires_at > NOW())`,
          [req.user.id, permissionCode],
        );

        if (rolePermissions.length === 0 && userPermissions.length === 0) {
          return res.status(403).json({
            success: false,
            message: `権限が不足しています: ${permissionCode}`,
          });
        }
      }

      next();
    } catch (error) {
      console.error("批量权限验证失败:", error);
      res.status(500).json({
        success: false,
        message: "サーバーエラー",
      });
    }
  };
};

// 权限检查工具函数（用于在控制器中检查权限）
export const checkUserPermission = async (userId, role, permissionCode) => {
  try {
    // 管理员拥有所有权限
    if (role === "admin") {
      return true;
    }

    // 检查角色权限
    const [rolePermissions] = await db.query(
      `SELECT 1 FROM role_permissions rp
       JOIN permissions p ON rp.permission_id = p.id
       WHERE rp.role_id = ? AND p.code = ?`,
      [role, permissionCode],
    );

    if (rolePermissions.length > 0) {
      return true;
    }

    // 检查用户特殊权限
    const [userPermissions] = await db.query(
      `SELECT 1 FROM user_permissions up
       JOIN permissions p ON up.permission_id = p.id
       WHERE up.user_id = ? AND p.code = ? AND up.is_active = TRUE
       AND (up.expires_at IS NULL OR up.expires_at > NOW())`,
      [userId, permissionCode],
    );

    return userPermissions.length > 0;
  } catch (error) {
    console.error("权限检查失败:", error);
    return false;
  }
};
