/**
 * 数据库模型管理工具
 * 这个文件用于集中管理所有的数据库模型
 */
import { query, transaction } from "../connection.js";

// 用户模型
export const User = {
  // 通过ID查找用户
  async findById(id) {
    const sql =
      "SELECT id, username, email, role, first_name, last_name, avatar, department, created_at, updated_at, last_login, is_active FROM users WHERE id = ?";
    const users = await query(sql, [id]);
    return users.length ? users[0] : null;
  },

  // 通过用户名查找用户
  async findByUsername(username) {
    const sql = "SELECT * FROM users WHERE username = ?";
    const users = await query(sql, [username]);
    return users.length ? users[0] : null;
  },

  // 通过电子邮件查找用户
  async findByEmail(email) {
    const sql = "SELECT * FROM users WHERE email = ?";
    const users = await query(sql, [email]);
    return users.length ? users[0] : null;
  },

  // 创建新用户
  async create(userData) {
    const { username, email, password, role, first_name, last_name, avatar, department } = userData;

    const sql = `
      INSERT INTO users (username, email, password, role, first_name, last_name, avatar, department)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      username,
      email,
      password,
      role || "staff",
      first_name,
      last_name,
      avatar,
      department,
    ];

    const result = await query(sql, params);
    return result.insertId;
  },

  // 更新用户
  async update(id, userData) {
    const updates = [];
    const params = [];

    // 动态构建更新字段
    Object.entries(userData).forEach(([key, value]) => {
      if (key !== "id" && key !== "password") {
        // 排除ID和密码字段
        updates.push(`${key} = ?`);
        params.push(value);
      }
    });

    // 单独处理密码字段（如果有）
    if (userData.password) {
      updates.push("password = ?");
      params.push(userData.password);
    }

    if (updates.length === 0) {
      return false; // 没有要更新的字段
    }

    params.push(id); // WHERE 条件的参数

    const sql = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;
    const result = await query(sql, params);

    return result.affectedRows > 0;
  },

  // 更新最后登录时间
  async updateLastLogin(id) {
    const sql = "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?";
    const result = await query(sql, [id]);
    return result.affectedRows > 0;
  },

  // 删除用户
  async delete(id) {
    const sql = "DELETE FROM users WHERE id = ?";
    const result = await query(sql, [id]);
    return result.affectedRows > 0;
  },

  // 获取所有用户（分页）
  async findAll(page = 1, limit = 10, filter = {}) {
    let sql = `
      SELECT id, username, email, role, first_name, last_name, avatar, department, created_at, updated_at, last_login, is_active
      FROM users
      WHERE 1=1
    `;

    const params = [];

    // 添加过滤条件
    if (filter.role) {
      sql += " AND role = ?";
      params.push(filter.role);
    }

    if (filter.isActive !== undefined) {
      sql += " AND is_active = ?";
      params.push(filter.isActive);
    }

    if (filter.search) {
      sql += " AND (username LIKE ? OR email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)";
      const searchTerm = `%${filter.search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // 添加排序和分页
    sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, (page - 1) * limit);

    return await query(sql, params);
  },

  // 获取用户总数（用于分页）
  async count(filter = {}) {
    let sql = "SELECT COUNT(*) as total FROM users WHERE 1=1";
    const params = [];

    // 添加过滤条件
    if (filter.role) {
      sql += " AND role = ?";
      params.push(filter.role);
    }

    if (filter.isActive !== undefined) {
      sql += " AND is_active = ?";
      params.push(filter.isActive);
    }

    if (filter.search) {
      sql += " AND (username LIKE ? OR email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)";
      const searchTerm = `%${filter.search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const result = await query(sql, params);
    return result[0].total;
  },
};

// 导出所有模型
export default {
  User,
};
