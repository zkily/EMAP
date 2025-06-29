import fs from "fs";
import path from "path";
import csv from "csv-parser";
import chokidar from "chokidar";
import iconv from "iconv-lite";
import { query } from "../../../db/connection.js";

// 文件路径配置
const NETWORK_PATH = "\\\\192.168.1.200\\社内共有\\02_生産管理部\\Data\\BT-data\\受信";
const FILE_NAME = "PickingLog.csv";
const FULL_FILE_PATH = path.join(NETWORK_PATH, FILE_NAME);

// 文件监视器实例
let watcher = null;
let isProcessing = false;

/**
 * 解析CSV文件并保存到数据库
 * @param {string} filePath - CSV文件路径
 */
const processCsvFile = async (filePath) => {
  if (isProcessing) {
    console.log("正在处理文件，跳过此次更新");
    return;
  }

  isProcessing = true;
  console.log(`开始处理文件: ${filePath}`);

  try {
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.error(`文件不存在: ${filePath}`);
      return;
    }

    const records = [];

    // 读取CSV文件
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(iconv.decodeStream("shift_jis"))
        .pipe(
          csv({
            headers: [
              "project",
              "date",
              "datetime",
              "model_no",
              "person_in_charge",
              "picking_no",
              "product_name",
              "product_code",
              "product_name_2",
              "quantity",
              "shipping_quantity",
            ],
            skipEmptyLines: true,
          }),
        )
        .on("data", (data) => {
          // 数据验证和清理
          const formattedDate = data.date ? formatDate(data.date) : null;
          const formattedDateTime = data.datetime ? formatDateTime(data.datetime, data.date) : null;

          const record = {
            project: data.project || "",
            date: formattedDate,
            datetime: formattedDateTime,
            model_no: data.model_no || "",
            person_in_charge: data.person_in_charge || "",
            picking_no: data.picking_no || "",
            product_name: data.product_name || "",
            product_code: data.product_code || "",
            product_name_2: data.product_name_2 || "",
            quantity: parseInt(data.quantity) || 0,
            shipping_quantity: parseInt(data.shipping_quantity) || 0,
          };

          // 添加调试信息
          if (data.date || data.datetime) {
            console.log(`原始数据 - 日期: "${data.date}", 时间: "${data.datetime}"`);
            console.log(`格式化后 - 日期: "${formattedDate}", 时间: "${formattedDateTime}"`);
          }

          // 只添加有效记录（至少有picking_no或product_code）
          if (record.picking_no || record.product_code) {
            records.push(record);
          }
        })
        .on("end", resolve)
        .on("error", reject);
    });

    console.log(`读取到 ${records.length} 条记录`);

    if (records.length > 0) {
      // 批量插入数据库
      await insertRecords(records);
      console.log(`成功处理 ${records.length} 条记录`);
    }
  } catch (error) {
    console.error("处理CSV文件时出错:", error);
  } finally {
    isProcessing = false;
  }
};

/**
 * 去重复处理记录
 * @param {Array} records - 记录数组
 * @returns {Array} - 去重后的记录数组
 */
const deduplicateRecords = (records) => {
  const uniqueRecords = [];
  const seenKeys = new Set();

  for (const record of records) {
    // 创建唯一键：picking_no + product_code + date
    const uniqueKey = `${record.picking_no || "null"}_${record.product_code || "null"}_${record.date || "null"}`;

    if (!seenKeys.has(uniqueKey)) {
      seenKeys.add(uniqueKey);
      uniqueRecords.push(record);
    } else {
      console.log(`跳过重复记录: ${uniqueKey}`);
    }
  }

  const duplicateCount = records.length - uniqueRecords.length;
  if (duplicateCount > 0) {
    console.log(`在本次处理中发现并跳过了 ${duplicateCount} 条重复记录`);
  }

  return uniqueRecords;
};

/**
 * 批量检查数据库中已存在的记录（性能优化）
 * @param {Array} records - 记录数组
 * @returns {Object} - 包含existingRecords和newRecords的对象
 */
const batchCheckExistingRecords = async (records) => {
  if (records.length === 0) {
    return { existingRecords: [], newRecords: [] };
  }

  // 构建批量查询的条件
  const conditions = [];
  const params = [];

  // 只检查有完整关键字段的记录
  const recordsToCheck = records.filter(record =>
    record.picking_no && record.product_code && record.date
  );

  // 没有完整关键字段的记录直接归类为新记录
  const recordsWithoutCompleteKeys = records.filter(record =>
    !(record.picking_no && record.product_code && record.date)
  );

  if (recordsToCheck.length === 0) {
    return { existingRecords: [], newRecords: recordsWithoutCompleteKeys };
  }

  // 构建批量查询SQL
  for (const record of recordsToCheck) {
    conditions.push("(picking_no = ? AND product_code = ? AND date = ?)");
    params.push(record.picking_no, record.product_code, record.date);
  }

  try {
    const sql = `
      SELECT picking_no, product_code, date
      FROM shipping_log
      WHERE ${conditions.join(" OR ")}
    `;

    const existingResults = await query(sql, params);

    // 创建已存在记录的Set，用于快速查找
    const existingSet = new Set(
      existingResults.map(row => `${row.picking_no}_${row.product_code}_${row.date}`)
    );

    const existingRecords = [];
    const newRecords = [...recordsWithoutCompleteKeys]; // 包含没有完整关键字段的记录

    for (const record of recordsToCheck) {
      const key = `${record.picking_no}_${record.product_code}_${record.date}`;
      if (existingSet.has(key)) {
        existingRecords.push(record);
        console.log(`跳过数据库中已存在的记录: ${key}`);
      } else {
        newRecords.push(record);
      }
    }

    return { existingRecords, newRecords };
  } catch (error) {
    console.error("批量检查记录是否存在时出错:", error);
    // 出错时，将所有记录视为新记录
    return { existingRecords: [], newRecords: records };
  }
};

/**
 * 同步shipping_log数据到picking_tasks表（增强版本）
 * @param {Array} records - 需要同步的记录数组
 */
const syncToPickingTasks = async (records) => {
  if (records.length === 0) return;

  // 只处理有picking_no的记录
  const validRecords = records.filter(record => record.picking_no);

  if (validRecords.length === 0) {
    console.log("没有有效的picking_no记录需要同步到picking_tasks");
    return;
  }

  let syncedCount = 0;
  let failedCount = 0;
  let notFoundCount = 0;

  console.log(`开始同步 ${validRecords.length} 条记录到picking_tasks表`);

  // 逐个处理同步操作
  for (const record of validRecords) {
    try {
      // 首先检查picking_tasks中是否存在匹配的记录
      const checkSql = `
        SELECT id, shipping_no_p, status
        FROM picking_tasks
        WHERE shipping_no_p = ?
        LIMIT 1
      `;

      const existingRecords = await query(checkSql, [record.picking_no]);

      if (existingRecords.length === 0) {
        notFoundCount++;
        console.log(`picking_tasks中未找到匹配的记录: shipping_no_p=${record.picking_no}`);

        // 调试：检查相似记录
        await debugPickingTasks(record.picking_no);
        continue;
      }

      const existingRecord = existingRecords[0];
      console.log(`找到匹配记录: ID=${existingRecord.id}, shipping_no_p=${existingRecord.shipping_no_p}, 当前状态=${existingRecord.status}`);

      // 更新picking_tasks表
      const updateSql = `
        UPDATE picking_tasks
        SET
          start_time = ?,
          picker_id = ?,
          product_name = ?,
          product_cd = ?,
          picked_quantity = ?,
          picked_no = ?,
          status = 'completed',
          updated_at = CURRENT_TIMESTAMP
        WHERE shipping_no_p = ?
      `;

      const values = [
        record.datetime,           // start_time
        record.person_in_charge,   // picker_id
        record.product_name,       // product_name
        record.product_code,       // product_cd
        record.quantity,           // picked_quantity
        record.picking_no,         // picked_no
        record.picking_no          // WHERE条件：shipping_no_p
      ];

      const result = await query(updateSql, values);

      if (result.affectedRows > 0) {
        syncedCount++;
        console.log(`✓ 成功同步到picking_tasks: picking_no=${record.picking_no}, 状态已更新为'completed'`);

        // 记录详细的同步信息
        console.log(`  - 开始时间: ${record.datetime}`);
        console.log(`  - 拣货员: ${record.person_in_charge}`);
        console.log(`  - 产品名称: ${record.product_name}`);
        console.log(`  - 产品编码: ${record.product_code}`);
        console.log(`  - 拣货数量: ${record.quantity}`);
      } else {
        failedCount++;
        console.error(`✗ 同步失败: picking_no=${record.picking_no}, 没有行被更新`);
      }
    } catch (error) {
      failedCount++;
      console.error(`✗ 同步到picking_tasks失败: picking_no=${record.picking_no}`, error.message);
    }
  }

  // 汇总结果
  console.log(`\n=== picking_tasks同步汇总 ===`);
  console.log(`总处理记录: ${validRecords.length} 条`);
  console.log(`成功同步: ${syncedCount} 条`);
  console.log(`未找到匹配: ${notFoundCount} 条`);
  console.log(`同步失败: ${failedCount} 条`);
  console.log(`========================\n`);

  if (syncedCount > 0) {
    console.log(`🎉 成功同步 ${syncedCount} 条记录，状态已更新为'completed'`);
  }

  if (notFoundCount > 0) {
    console.warn(`⚠️  有 ${notFoundCount} 条记录在picking_tasks中未找到匹配项，请检查数据一致性`);
  }
};

/**
 * 调试用：检查picking_tasks表中的数据
 * @param {string} pickingNo - picking_no值
 */
const debugPickingTasks = async (pickingNo) => {
  try {
    console.log(`\n=== 调试信息: 检查picking_tasks表 ===`);

    // 检查是否存在相似的shipping_no_p
    const similarSql = `
      SELECT shipping_no_p, status, created_at
      FROM picking_tasks
      WHERE shipping_no_p LIKE ?
      ORDER BY created_at DESC
      LIMIT 10
    `;

    const similarRecords = await query(similarSql, [`%${pickingNo}%`]);

    if (similarRecords.length > 0) {
      console.log(`找到 ${similarRecords.length} 条相似的记录:`);
      similarRecords.forEach((record, index) => {
        console.log(`  ${index + 1}. shipping_no_p: "${record.shipping_no_p}", status: "${record.status}", created_at: ${record.created_at}`);
      });
    } else {
      console.log(`未找到包含 "${pickingNo}" 的记录`);

      // 显示最近的几条记录作为参考
      const recentSql = `
        SELECT shipping_no_p, status, created_at
        FROM picking_tasks
        ORDER BY created_at DESC
        LIMIT 5
      `;

      const recentRecords = await query(recentSql);
      console.log(`最近的5条picking_tasks记录:`);
      recentRecords.forEach((record, index) => {
        console.log(`  ${index + 1}. shipping_no_p: "${record.shipping_no_p}", status: "${record.status}", created_at: ${record.created_at}`);
      });
    }

    console.log(`================================\n`);
  } catch (error) {
    console.error("调试picking_tasks时出错:", error);
  }
};

/**
 * 批量插入记录到数据库（简化版本，无事务）
 * @param {Array} records - 记录数组
 */
const insertRecords = async (records) => {
  if (records.length === 0) return;

  try {
    // 第一步：去除本次处理中的重复记录
    const deduplicatedRecords = deduplicateRecords(records);

    // 第二步：批量检查数据库中是否已存在
    const { existingRecords, newRecords } = await batchCheckExistingRecords(deduplicatedRecords);

    if (existingRecords.length > 0) {
      console.log(`发现 ${existingRecords.length} 条记录在数据库中已存在，将跳过插入`);
    }

    // 第三步：批量插入新记录
    let insertedCount = 0;
    let updatedCount = 0;
    const recordsToSync = []; // 需要同步到picking_tasks的记录

    // 分批处理，避免SQL语句过长
    const batchSize = 50; // 减少批次大小以提高稳定性
    for (let i = 0; i < newRecords.length; i += batchSize) {
      const batch = newRecords.slice(i, i + batchSize);

      for (const record of batch) {
        const sql = `
          INSERT INTO shipping_log
          (project, date, datetime, model_no, person_in_charge, picking_no, product_name, product_code, product_name_2, quantity, shipping_quantity)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          project = VALUES(project),
          date = VALUES(date),
          datetime = VALUES(datetime),
          model_no = VALUES(model_no),
          person_in_charge = VALUES(person_in_charge),
          product_name = VALUES(product_name),
          product_code = VALUES(product_code),
          product_name_2 = VALUES(product_name_2),
          quantity = VALUES(quantity),
          shipping_quantity = VALUES(shipping_quantity),
          updated_at = CURRENT_TIMESTAMP
        `;

        const values = [
          record.project,
          record.date,
          record.datetime,
          record.model_no,
          record.person_in_charge,
          record.picking_no,
          record.product_name,
          record.product_code,
          record.product_name_2,
          record.quantity,
          record.shipping_quantity,
        ];

        try {
          const result = await query(sql, values);
          if (result.affectedRows === 1) {
            insertedCount++;
            recordsToSync.push(record); // 新插入的记录需要同步
          } else if (result.affectedRows === 2) {
            updatedCount++;
            recordsToSync.push(record); // 更新的记录也需要同步
          }
        } catch (error) {
          console.error(`插入记录失败:`, record, error.message);
          // 继续处理其他记录
        }
      }

      // 每批处理完成后稍微延迟，减少数据库压力
      if (i + batchSize < newRecords.length) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    console.log(
      `处理完成: 原始记录 ${records.length} 条, 去重后 ${deduplicatedRecords.length} 条, 新插入 ${insertedCount} 条, 更新 ${updatedCount} 条, 跳过已存在 ${existingRecords.length} 条`,
    );

    // 同步数据到picking_tasks表
    if (recordsToSync.length > 0) {
      await syncToPickingTasks(recordsToSync);
    }

  } catch (error) {
    console.error("批量插入记录时出错:", error);
    throw error;
  }
};

/**
 * 格式化日期字符串
 * @param {string} dateStr - 日期字符串
 * @returns {string|null} - 格式化后的日期
 */
const formatDate = (dateStr) => {
  try {
    if (!dateStr || dateStr.trim() === "") return null;

    const trimmedStr = dateStr.trim();
    let year, month, day;

    if (trimmedStr.includes("/")) {
      const parts = trimmedStr.split("/");
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          // YYYY/MM/DD 格式
          year = parseInt(parts[0]);
          month = parseInt(parts[1]);
          day = parseInt(parts[2]);
        } else {
          // MM/DD/YYYY 或 M/D/YYYY 格式
          month = parseInt(parts[0]);
          day = parseInt(parts[1]);
          year = parseInt(parts[2]);

          // 如果年份是两位数，假设是20xx年
          if (year < 100) {
            year = 2000 + year;
          }
        }
      } else if (parts.length === 2) {
        // M/D 格式，假设是当前年
        month = parseInt(parts[0]);
        day = parseInt(parts[1]);
        year = new Date().getFullYear();
      }
    } else if (trimmedStr.includes("-")) {
      const parts = trimmedStr.split("-");
      if (parts.length === 3) {
        year = parseInt(parts[0]);
        month = parseInt(parts[1]);
        day = parseInt(parts[2]);
      }
    } else {
      // 尝试直接解析
      const date = new Date(trimmedStr);
      if (!isNaN(date.getTime())) {
        year = date.getFullYear();
        month = date.getMonth() + 1;
        day = date.getDate();
      }
    }

    if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
      console.warn(`无效的日期格式: ${dateStr}`);
      return null;
    }

    // 手动构建日期字符串，避免时区问题
    const formattedDate = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;

    // 验证日期是否有效
    const testDate = new Date(formattedDate + "T00:00:00");
    if (
      isNaN(testDate.getTime()) ||
      testDate.getFullYear() !== year ||
      testDate.getMonth() + 1 !== month ||
      testDate.getDate() !== day
    ) {
      console.warn(`无效的日期: ${dateStr} -> ${formattedDate}`);
      return null;
    }

    return formattedDate;
  } catch (error) {
    console.warn(`日期格式化失败: ${dateStr}`, error);
    return null;
  }
};

/**
 * 格式化日期时间字符串
 * @param {string} datetimeStr - 日期时间字符串
 * @param {string} dateStr - 对应的日期字符串，用于组合完整的日期时间
 * @returns {string|null} - 格式化后的日期时间
 */
const formatDateTime = (datetimeStr, dateStr = null) => {
  try {
    if (!datetimeStr || datetimeStr.trim() === "") return null;

    const trimmedStr = datetimeStr.trim();
    let hour = 0,
      minute = 0,
      second = 0;
    let year, month, day;

    // 如果包含完整的日期时间
    if (trimmedStr.includes(" ") || trimmedStr.includes("T")) {
      const date = new Date(trimmedStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().slice(0, 19).replace("T", " ");
      }
    }

    // 如果只是时间格式 (HH:MM:SS 或 H:MM:SS 或 HH:MM 或 H:MM)
    if (trimmedStr.includes(":")) {
      const timeParts = trimmedStr.split(":");
      if (timeParts.length >= 2) {
        hour = parseInt(timeParts[0]) || 0;
        minute = parseInt(timeParts[1]) || 0;
        if (timeParts.length >= 3) {
          second = parseInt(timeParts[2]) || 0;
        }

        // 验证时间有效性
        if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59 && second >= 0 && second <= 59) {
          // 如果有日期字符串，使用它；否则使用当前日期
          if (dateStr) {
            const formattedDate = formatDate(dateStr);
            if (formattedDate) {
              const formattedTime = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:${second.toString().padStart(2, "0")}`;
              return `${formattedDate} ${formattedTime}`;
            }
          } else {
            // 使用当前日期
            const today = new Date();
            const currentDate = formatDateFromDateObject(today);
            const formattedTime = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:${second.toString().padStart(2, "0")}`;
            return `${currentDate} ${formattedTime}`;
          }
        }
      }
    }

    // 尝试直接解析
    const date = new Date(trimmedStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().slice(0, 19).replace("T", " ");
    }

    console.warn(`无效的日期时间格式: ${datetimeStr}`);
    return null;
  } catch (error) {
    console.warn(`日期时间格式化失败: ${datetimeStr}`, error);
    return null;
  }
};

/**
 * 从Date对象格式化日期字符串
 * @param {Date} dateObj - Date对象
 * @returns {string} - 格式化后的日期字符串
 */
const formatDateFromDateObject = (dateObj) => {
  const year = dateObj.getFullYear();
  const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
  const day = dateObj.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * 启动文件监视器
 */
export const startFileWatcher = () => {
  try {
    // 检查网络路径是否可访问
    if (!fs.existsSync(NETWORK_PATH)) {
      console.error(`网络路径不可访问: ${NETWORK_PATH}`);
      console.log("请确保网络驱动器已连接且有访问权限");
      return false;
    }

    console.log(`开始监视文件: ${FULL_FILE_PATH}`);

    // 创建文件监视器
    watcher = chokidar.watch(FULL_FILE_PATH, {
      ignored: /^\./, // 忽略隐藏文件
      persistent: true,
      usePolling: true, // 对于网络驱动器使用轮询
      interval: 5000, // 每5秒检查一次
      binaryInterval: 10000, // 二进制文件每10秒检查一次
      awaitWriteFinish: {
        stabilityThreshold: 2000, // 文件稳定2秒后才处理
        pollInterval: 1000,
      },
    });

    // 监听文件变化事件
    watcher
      .on("add", (filePath) => {
        console.log(`检测到新文件: ${filePath}`);
        processCsvFile(filePath);
      })
      .on("change", (filePath) => {
        console.log(`检测到文件变化: ${filePath}`);
        processCsvFile(filePath);
      })
      .on("error", (error) => {
        console.error("文件监视器错误:", error);
      })
      .on("ready", () => {
        console.log("文件监视器已启动");

        // 启动时处理一次现有文件
        if (fs.existsSync(FULL_FILE_PATH)) {
          console.log("处理现有文件...");
          processCsvFile(FULL_FILE_PATH);
        }
      });

    return true;
  } catch (error) {
    console.error("启动文件监视器失败:", error);
    return false;
  }
};

/**
 * 停止文件监视器
 */
export const stopFileWatcher = () => {
  if (watcher) {
    watcher.close();
    watcher = null;
    console.log("文件监视器已停止");
  }
};

/**
 * 获取监视器状态
 */
export const getWatcherStatus = async () => {
  try {
    // 获取处理统计信息
    const statsQuery = `
      SELECT
        COUNT(*) as processedFiles,
        MAX(created_at) as lastProcessTime
      FROM shipping_log
    `;
    const [stats] = await query(statsQuery);

    return {
      isRunning: watcher !== null,
      isProcessing,
      watchPath: FULL_FILE_PATH,
      networkPath: NETWORK_PATH,
      processedFiles: stats.processedFiles || 0,
      lastProcessTime: stats.lastProcessTime || null,
    };
  } catch (error) {
    console.error("获取监视器状态时出错:", error);
    return {
      isRunning: watcher !== null,
      isProcessing,
      watchPath: FULL_FILE_PATH,
      networkPath: NETWORK_PATH,
      processedFiles: 0,
      lastProcessTime: null,
    };
  }
};

/**
 * 手动处理文件
 */
export const manualProcessFile = async () => {
  return await processCsvFile(FULL_FILE_PATH);
};

export default {
  startFileWatcher,
  stopFileWatcher,
  getWatcherStatus,
  manualProcessFile,
};
