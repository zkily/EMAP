/**
 * 种子: 示例数据
 * 创建于: 2023-09-08
 */

/**
 * 执行种子填充数据
 * @param {import('mysql2/promise').PoolConnection} connection 数据库连接
 */
export async function run(connection) {
  console.log("执行示例数据种子...");

  // 插入测试用户
  const usersData = [
    {
      username: "test_manager",
      email: "manager@example.com",
      password: "$2b$10$6TUuWRcTZJBfhCKWDbcR9eKzydQbNIHzsmWLJ7EgOXEh5TRyFmKUu", // bcrypt加密的 'test123'
      role: "manager",
      first_name: "测试",
      last_name: "经理",
    },
    {
      username: "test_staff",
      email: "staff@example.com",
      password: "$2b$10$6TUuWRcTZJBfhCKWDbcR9eKzydQbNIHzsmWLJ7EgOXEh5TRyFmKUu", // bcrypt加密的 'test123'
      role: "staff",
      first_name: "测试",
      last_name: "员工",
    },
  ];

  // 插入用户数据
  console.log("插入测试用户数据...");
  const insertUserSql = `
    INSERT INTO users (username, email, password, role, first_name, last_name)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  for (const user of usersData) {
    await connection.execute(insertUserSql, [
      user.username,
      user.email,
      user.password,
      user.role,
      user.first_name,
      user.last_name,
    ]);
  }

  // 这里可以插入其他测试数据...

  console.log("示例数据已插入");
}

/**
 * 重置种子数据
 * @param {import('mysql2/promise').PoolConnection} connection 数据库连接
 */
export async function reset(connection) {
  console.log("重置示例数据...");

  // 删除测试用户
  const deleteUsersSql = `
    DELETE FROM users
    WHERE username IN ('test_manager', 'test_staff')
  `;

  await connection.execute(deleteUsersSql);

  // 这里可以重置其他测试数据...

  console.log("示例数据已重置");
}
