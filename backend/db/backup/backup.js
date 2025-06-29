/**
 * 数据库备份工具
 * 使用方法:
 *   node backup.js create - 创建新备份
 *   node backup.js list   - 列出所有备份
 *   node backup.js restore <filename> - 从指定备份恢复
 */
import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 创建备份目录（如果不存在）
const backupDir = path.join(__dirname, 'snapshots');

const createBackupDir = async () => {
  try {
    await fs.mkdir(backupDir, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
};

// 获取MySQL命令行参数
const getMysqlArgs = () => {
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '3306';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'smart_emap';

  return {
    host,
    port,
    user,
    password,
    database
  };
};

// 执行命令
const executeCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }

      if (stderr) {
        console.warn(stderr);
      }

      resolve(stdout);
    });
  });
};

// 创建备份
const createBackup = async () => {
  await createBackupDir();

  const { host, port, user, password, database } = getMysqlArgs();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup_${database}_${timestamp}.sql`;
  const filePath = path.join(backupDir, filename);

  // 构建mysqldump命令
  const command = `mysqldump --host=${host} --port=${port} --user=${user} ${password ? `--password=${password}` : ''} --databases ${database} --add-drop-database --routines --events --triggers --single-transaction > "${filePath}"`;

  try {
    console.log('创建数据库备份中...');
    await executeCommand(command);
    console.log(`备份已创建: ${filePath}`);

    // 创建备份元数据文件
    const metadataPath = `${filePath}.json`;
    const metadata = {
      database,
      timestamp: new Date().toISOString(),
      size: (await fs.stat(filePath)).size,
      command
    };

    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    console.log(`备份元数据已创建: ${metadataPath}`);

    return filePath;
  } catch (error) {
    console.error('创建备份失败:', error.message);
    throw error;
  }
};

// 列出所有备份
const listBackups = async () => {
  try {
    await createBackupDir();

    const files = await fs.readdir(backupDir);
    const backups = files
      .filter(file => file.endsWith('.sql'))
      .map(file => ({
        filename: file,
        path: path.join(backupDir, file),
        created: file.split('_').pop().replace('.sql', '')
      }))
      .sort((a, b) => b.created.localeCompare(a.created));

    if (backups.length === 0) {
      console.log('没有找到备份文件');
      return [];
    }

    console.log('可用备份:');
    backups.forEach((backup, index) => {
      console.log(`${index + 1}. ${backup.filename}`);
    });

    return backups;
  } catch (error) {
    console.error('列出备份失败:', error.message);
    throw error;
  }
};

// 从备份恢复
const restoreBackup = async (filename) => {
  try {
    const filePath = path.join(backupDir, filename);

    // 检查文件是否存在
    try {
      await fs.access(filePath);
    } catch (error) {
      console.error(`备份文件不存在: ${filePath}`);
      return false;
    }

    const { host, port, user, password, database } = getMysqlArgs();

    // 构建mysql命令
    const command = `mysql --host=${host} --port=${port} --user=${user} ${password ? `--password=${password}` : ''} < "${filePath}"`;

    console.log('正在从备份恢复数据库...');
    await executeCommand(command);
    console.log(`数据库已从 ${filePath} 恢复`);

    return true;
  } catch (error) {
    console.error('从备份恢复失败:', error.message);
    throw error;
  }
};

// 压缩旧备份
const compressOldBackups = async (daysOld = 7) => {
  try {
    await createBackupDir();

    const files = await fs.readdir(backupDir);
    const backups = files
      .filter(file => file.endsWith('.sql') && !file.endsWith('.gz'))
      .map(file => ({
        filename: file,
        path: path.join(backupDir, file)
      }));

    if (backups.length === 0) {
      console.log('没有需要压缩的备份文件');
      return;
    }

    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;

    for (const backup of backups) {
      const stats = await fs.stat(backup.path);
      const fileAge = (now - stats.mtime.getTime()) / msPerDay;

      if (fileAge > daysOld) {
        console.log(`压缩旧备份: ${backup.filename}`);
        const command = `gzip "${backup.path}"`;

        try {
          await executeCommand(command);
          console.log(`已压缩: ${backup.path}.gz`);
        } catch (error) {
          console.error(`压缩失败 ${backup.filename}:`, error.message);
        }
      }
    }
  } catch (error) {
    console.error('压缩旧备份失败:', error.message);
    throw error;
  }
};

// 设置定时备份 - 这个函数应该在主应用程序启动时调用
export const scheduleBackups = (cronTime = '0 0 * * *') => {
  // 每天凌晨自动备份
  const CronJob = require('cron').CronJob;
  const job = new CronJob(cronTime, async () => {
    try {
      console.log('执行定时备份...');
      await createBackup();

      // 压缩7天前的备份
      await compressOldBackups(7);

      console.log('定时备份完成');
    } catch (error) {
      console.error('定时备份失败:', error.message);
    }
  });

  job.start();
  console.log(`定时备份已设置: ${cronTime}`);

  return job;
};

// 命令行处理
const handleCommand = async () => {
  const command = process.argv[2];
  const arg = process.argv[3];

  if (!command) {
    console.log(`
数据库备份工具

使用方法:
  node backup.js create  - 创建新备份
  node backup.js list    - 列出所有备份
  node backup.js restore <filename> - 从指定备份恢复
  node backup.js compress [days]    - 压缩指定天数前的备份
`);
    return;
  }

  switch (command) {
    case 'create':
      await createBackup();
      break;

    case 'list':
      await listBackups();
      break;

    case 'restore':
      if (!arg) {
        console.error('错误: 请提供要恢复的备份文件名');
        console.log('使用: node backup.js restore <filename>');
        process.exit(1);
      }

      await restoreBackup(arg);
      break;

    case 'compress':
      const days = arg ? parseInt(arg, 10) : 7;
      await compressOldBackups(days);
      break;

    default:
      console.error(`未知命令: ${command}`);
      console.log('使用 node backup.js 查看帮助');
  }
};

// 如果是从命令行直接运行，则执行命令
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  handleCommand().catch(error => {
    console.error('命令执行失败:', error);
    process.exit(1);
  });
}

export default {
  createBackup,
  listBackups,
  restoreBackup,
  compressOldBackups,
  scheduleBackups
};
