/**
 * 创建用户表迁移
 */
export async function up(connection) {
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      email VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin', 'manager', 'staff') NOT NULL DEFAULT 'staff',
      first_name VARCHAR(50),
      last_name VARCHAR(50),
      avatar VARCHAR(255),
      department VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      last_login TIMESTAMP NULL,
      is_active BOOLEAN DEFAULT TRUE,
      INDEX idx_username (username),
      INDEX idx_email (email),
      INDEX idx_role (role)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  await connection.execute(sql);

  // 创建管理员账号
  const adminPassword = "$2b$10$6TUuWRcTZJBfhCKWDbcR9eKzydQbNIHzsmWLJ7EgOXEh5TRyFmKUu"; // bcrypt加密的 'admin123'
  const insertAdmin = `
    INSERT INTO users (username, email, password, role, first_name, last_name)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  await connection.execute(insertAdmin, [
    "admin",
    "admin@example.com",
    adminPassword,
    "admin",
    "Admin",
    "User",
  ]);

  console.log("用户表创建成功，并添加了管理员账号");
}

export async function down(connection) {
  const sql = `DROP TABLE IF EXISTS users`;
  await connection.execute(sql);
  console.log("用户表已删除");
}
