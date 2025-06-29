# Picking数据导出功能说明

## 功能概述

本功能实现了将`shipping_items`表中的数据复制到`picking_list`表，并导出为CSV文件保存到C盘aa文件夹的完整流程。

## 实现的功能

### 1. 数据库表结构

**新增的`picking_list`表：**

```sql
CREATE TABLE picking_list (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    shipping_no_p VARCHAR(50) NOT NULL COMMENT '出荷項目唯一ID',
    shipping_no VARCHAR(50) NOT NULL COMMENT '出荷番号',
    product_cd VARCHAR(50) NOT NULL COMMENT '製品コード',
    product_name VARCHAR(100) NOT NULL COMMENT '製品名',
    confirmed_boxes INT NOT NULL DEFAULT 0 COMMENT '箱数',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',

    UNIQUE KEY uk_shipping_product (shipping_no_p, product_cd),
    INDEX idx_shipping_no (shipping_no),
    INDEX idx_product_cd (product_cd)
);
```

### 2. 后端API接口

**文件：** `backend/routes/shipping/pickingExportRouter.js`

#### 导出API

- **路径：** `POST /api/shipping/export/export-picking-csv`
- **功能：**
  1. 自动创建`picking_list`表（如果不存在）
  2. 从`shipping_items`表查询数据（5个字段：shipping_no_p, shipping_no, product_cd, product_name, confirmed_boxes）
  3. 复制数据到`picking_list`表（避免重复数据）
  4. 生成CSV文件
  5. 保存到`C:\aa`文件夹
  6. 返回处理结果

#### 概要API

- **路径：** `GET /api/shipping/export/picking-list-summary`
- **功能：** 获取`picking_list`表的基本信息（总数、最新记录等）

### 3. 前端界面

**文件：** `frontend/src/views/Shipping/ShippingList.vue`

**新增按钮：** "ピッキングCSV出力"

- 位置：出荷一覧页面的操作按钮组
- 功能：点击后显示确认对话框，执行导出操作
- 反馈：显示导出结果（新增数据数量、文件名等）

**API接口文件：** `frontend/src/api/shipping/pickingExport.ts`

### 4. 特色功能

#### 数据去重

- 使用`INSERT IGNORE`避免重复插入
- 通过唯一索引`(shipping_no_p, product_cd)`确保数据唯一性

#### CSV文件命名

- 格式：`picking_list_YYYY-MM-DDTHH-mm-ss.csv`
- 示例：`picking_list_2024-01-15T14-30-25.csv`

#### 自动创建目录

- 如果`C:\aa`文件夹不存在，系统会自动创建

#### CSV格式处理

- 正确处理包含逗号、引号、换行符的数据
- 使用UTF-8编码保存

## 使用方法

### 1. 启动系统

```bash
# 后端
cd backend
npm start

# 前端
cd frontend
npm run dev
```

### 2. 使用界面

1. 访问前端系统
2. 进入"出荷管理" -> "出荷一覧"页面
3. 点击"ピッキングCSV出力"按钮
4. 确认对话框中点击"実行"
5. 等待处理完成，查看结果提示

### 3. 检查结果

- 查看`C:\aa`文件夹中的CSV文件
- 检查数据库中`picking_list`表的记录

## 错误处理

- 数据库连接错误：显示相应错误信息
- 文件写入错误：权限问题或磁盘空间不足
- 重复数据：自动跳过，不影响处理流程

## 日志信息

后端控制台会显示详细的处理过程：

- 表创建状态
- 数据查询结果
- 复制操作统计
- 文件保存路径

## 测试说明

可以通过以下方式测试功能：

### 直接API测试

```bash
# 概要信息
curl http://localhost:3000/api/shipping/export/picking-list-summary

# 导出功能
curl -X POST http://localhost:3000/api/shipping/export/export-picking-csv
```

### 数据库测试

```sql
-- 查看copying_list表数据
SELECT * FROM picking_list ORDER BY created_at DESC LIMIT 10;

-- 统计数据
SELECT COUNT(*) as total FROM picking_list;

-- 查看原始shipping_items数据
SELECT shipping_no_p, shipping_no, product_cd, product_name, confirmed_boxes
FROM shipping_items
WHERE shipping_no_p IS NOT NULL
LIMIT 10;
```

## 注意事项

1. 确保C盘有足够的写入权限
2. 如果shipping_items表中数据量很大，导出过程可能需要一些时间
3. CSV文件采用UTF-8编码，在Excel中打开时可能需要选择正确的编码格式
4. 每次导出只会添加新的数据，不会删除已有的picking_list记录
