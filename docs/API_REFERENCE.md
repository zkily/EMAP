# Smart-EMAP API 接口文档

## BOM API（部品構成）

### 1. 获取BOM列表

**请求方式:** GET  
**路径:** `/api/master/bom/list`  
**参数:**

- `product_cd` (可选): 产品编码，模糊匹配
- `product_name` (可选): 产品名称，模糊匹配

**返回示例:**

```json
[
  {
    "id": 1,
    "product_id": 100,
    "component_id": 200,
    "quantity": 2,
    "unit_price": 100.5,
    "note": "组装用",
    "product_cd": "P001",
    "product_name": "成品A",
    "component_cd": "C001",
    "component_name": "零件B"
  }
]
```

### 2. 新增BOM记录

**请求方式:** POST  
**路径:** `/api/master/bom/create`  
**请求体:**

```json
{
  "product_id": 100,
  "component_id": 200,
  "quantity": 2,
  "unit_price": 100.5,
  "note": "组装用"
}
```

**返回示例:**

```json
{
  "success": true,
  "message": "登録しました"
}
```

### 3. 更新BOM记录

**请求方式:** PUT  
**路径:** `/api/master/bom/update/:id`  
**参数:**

- `id`: BOM记录ID

**请求体:**

```json
{
  "product_id": 100,
  "component_id": 200,
  "quantity": 3,
  "unit_price": 120.5,
  "note": "组装用-更新"
}
```

**返回示例:**

```json
{
  "success": true,
  "message": "更新しました"
}
```

### 4. 删除BOM记录

**请求方式:** DELETE  
**路径:** `/api/master/bom/delete/:id`  
**参数:**

- `id`: BOM记录ID

**返回示例:**

```json
{
  "success": true,
  "message": "削除しました"
}
```

### 5. 获取产品选项

**请求方式:** GET  
**路径:** `/api/master/bom/product-options`

**返回示例:**

```json
[
  {
    "id": 1,
    "product_cd": "P001",
    "product_name": "成品A"
  }
]
```

### 6. 获取部品选项

**请求方式:** GET  
**路径:** `/api/master/bom/component-options`

**返回示例:**

```json
[
  {
    "id": 1,
    "component_cd": "C001",
    "component_name": "零件A"
  }
]
```

### 7. 获取BOM展开树

**请求方式:** GET  
**路径:** `/api/master/bom/tree/:productId`  
**参数:**

- `productId`: 产品ID

**返回示例:**

```json
[
  {
    "id": 1,
    "component_id": 100,
    "component_name": "零件A",
    "quantity": 2,
    "unit_price": 10.5,
    "level": 1,
    "children": [
      {
        "id": 2,
        "component_id": 101,
        "component_name": "子零件B",
        "quantity": 3,
        "unit_price": 5.5,
        "level": 2,
        "children": []
      }
    ]
  }
]
```

### 8. 获取BOM逆向展开（部品使用情况）

**请求方式:** GET  
**路径:** `/api/master/bom/tree/reverse/:componentId`  
**参数:**

- `componentId`: 部品ID

**返回示例:**

```json
[
  {
    "id": 1,
    "product_id": 200,
    "product_name": "成品A",
    "quantity": 2,
    "level": 1,
    "path": "成品A"
  },
  {
    "id": 2,
    "product_id": 201,
    "product_name": "成品B",
    "quantity": 1,
    "level": 2,
    "path": "成品A < 成品B"
  }
]
```

## 部品マスタ API（部品主数据）

### 1. 获取部品列表

**请求方式:** GET  
**路径:** `/api/master/components`  
**参数:**

- `keyword` (可选): 搜索关键词，模糊匹配部品编码或名称

**返回示例:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "component_cd": "C001",
      "component_name": "零件A",
      "spec_model": "规格A",
      "unit": "个",
      "supplier_cd": "S001",
      "supplier_name": "供应商A"
    }
  ],
  "total": 1
}
```

### 2. 新增部品

**请求方式:** POST  
**路径:** `/api/master/components`  
**请求体:**

```json
{
  "component_cd": "C002",
  "component_name": "零件B",
  "spec_model": "规格B",
  "unit": "个",
  "supplier_cd": "S001"
}
```

**返回示例:**

```json
{
  "success": true,
  "message": "登録しました"
}
```

### 3. 更新部品

**请求方式:** PUT  
**路径:** `/api/master/components/:id`  
**参数:**

- `id`: 部品ID

**请求体:**

```json
{
  "component_cd": "C002",
  "component_name": "零件B-更新",
  "spec_model": "规格B-更新",
  "unit": "个",
  "supplier_cd": "S001"
}
```

**返回示例:**

```json
{
  "success": true,
  "message": "更新しました"
}
```

### 4. 删除部品

**请求方式:** DELETE  
**路径:** `/api/master/components/:id`  
**参数:**

- `id`: 部品ID

**返回示例:**

```json
{
  "success": true,
  "message": "削除しました"
}
```
