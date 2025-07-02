import { db } from "../../../db/index.js";

// 标准响应格式
function standardResponse(success, message, data = null) {
  return {
    success,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

// 获取溶接相关产品列表
export async function getWeldingProducts(req, res) {
  try {
    const query = `
      SELECT
        product_cd as value,
        product_name as label
      FROM products
      WHERE category = 'メカ溶接'
      ORDER BY product_cd ASC
    `;

    const [rows] = await db.query(query);

    res.json(standardResponse(true, "溶接製品一覧を取得しました", rows));
  } catch (error) {
    console.error("溶接製品取得エラー:", error);
    res.status(500).json(standardResponse(false, "溶接製品の取得に失敗しました"));
  }
}

// 获取溶接出荷数据（生成二维表）
export async function getWeldingShippingData(req, res) {
  try {
    const { start_date, end_date, products } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json(standardResponse(false, "開始日と終了日を指定してください"));
    }

    if (!products || products.length === 0) {
      return res.status(400).json(standardResponse(false, "製品を選択してください"));
    }

    // 产品列表处理
    const productList = Array.isArray(products) ? products : [products];
    const productPlaceholders = productList.map(() => "?").join(",");

    const query = `
      SELECT
        shipping_date,
        destination_name,
        product_name,
        product_cd,
        confirmed_boxes
      FROM shipping_items
      WHERE shipping_date BETWEEN ? AND ?
        AND product_cd IN (${productPlaceholders})
        AND status != 'キャンセル'
      ORDER BY confirmed_boxes DESC, shipping_date ASC, destination_name ASC, product_name ASC
    `;

    const params = [start_date, end_date, ...productList];
    const [rows] = await db.query(query, params);

    // 全ての選択された製品の名称を取得する
    const productInfoQuery = `SELECT product_cd, product_name FROM products WHERE product_cd IN (${productPlaceholders})`;
    const [productInfoRows] = await db.query(productInfoQuery, productList);
    const productInfoMap = new Map(productInfoRows.map((p) => [p.product_cd, p.product_name]));

    // 生成二维表数据结构
    const tableData = generateTableData(rows, productList, productInfoMap, start_date, end_date);

    res.json(standardResponse(true, "溶接出荷データを取得しました", tableData));
  } catch (error) {
    console.error("溶接出荷データ取得エラー:", error);
    res.status(500).json(standardResponse(false, "溶接出荷データの取得に失敗しました"));
  }
}

// 导出溶接出荷报告
export async function exportWeldingShippingReport(req, res) {
  try {
    const { start_date, end_date, table_data } = req.body;

    if (!table_data) {
      return res.status(400).json(standardResponse(false, "テーブルデータが必要です"));
    }

    // 生成打印用的HTML
    const printHtml = generatePrintHtml(table_data, start_date, end_date);

    res.json(
      standardResponse(true, "溶接出荷レポートを生成しました", {
        html: printHtml,
        filename: `welding_shipping_report_${start_date}_${end_date}.html`,
      }),
    );
  } catch (error) {
    console.error("溶接出荷レポート生成エラー:", error);
    res.status(500).json(standardResponse(false, "溶接出荷レポートの生成に失敗しました"));
  }
}

// 生成二维表数据
function generateTableData(rawData, productCdList, productInfoMap, startDate, endDate) {
  // 获取所有唯一的纳入先
  const destinations = [...new Set(rawData.map((row) => row.destination_name))].sort();

  // 获取日期范围内的所有日期
  const dates = generateDateRange(startDate, endDate);

  const products = productCdList.map((cd) => ({
    cd: cd,
    name: productInfoMap.get(cd) || cd, // 見つからない場合はコードをそのまま使用
  }));

  // 初始化表格数据结构
  const tableData = {
    dates: dates,
    destinations: destinations,
    products: products, // これが {cd, name} の配列になる
    data: {},
  };

  // 为每个日期、纳入先、产品组合初始化数据
  dates.forEach((date) => {
    tableData.data[date] = {};
    destinations.forEach((dest) => {
      tableData.data[date][dest] = {};
      productCdList.forEach((productCd) => {
        tableData.data[date][dest][productCd] = [];
      });
    });
  });

  // 填充实际数据（不合计，保留所有记录）
  rawData.forEach((row) => {
    const date = formatDate(row.shipping_date);
    const dest = row.destination_name;
    const productCd = row.product_cd;

    if (tableData.data[date]?.[dest]?.[productCd]) {
      tableData.data[date][dest][productCd].push({
        boxes: parseInt(row.confirmed_boxes) || 0,
      });
    }
  });

  return tableData;
}

// 生成日期范围
function generateDateRange(startDate, endDate) {
  const dates = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    dates.push(formatDate(date));
  }

  return dates;
}

// 格式化日期
function formatDate(date) {
  if (typeof date === "string") return date;

  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// 计算合计
function calculateTotals(tableData) {
  const totals = {
    byDate: {},
    byDestination: {},
    byProduct: {},
    grand: { units: 0, boxes: 0, count: 0 },
  };

  // 按日期合计
  tableData.dates.forEach((date) => {
    totals.byDate[date] = { units: 0, boxes: 0, count: 0 };
    tableData.destinations.forEach((dest) => {
      tableData.products.forEach((product) => {
        const data = tableData.data[date][dest][product];
        totals.byDate[date].units += data.units;
        totals.byDate[date].boxes += data.boxes;
        totals.byDate[date].count += data.count;
      });
    });
  });

  // 按纳入先合计
  tableData.destinations.forEach((dest) => {
    totals.byDestination[dest] = { units: 0, boxes: 0, count: 0 };
    tableData.dates.forEach((date) => {
      tableData.products.forEach((product) => {
        const data = tableData.data[date][dest][product];
        totals.byDestination[dest].units += data.units;
        totals.byDestination[dest].boxes += data.boxes;
        totals.byDestination[dest].count += data.count;
      });
    });
  });

  // 按产品合计
  tableData.products.forEach((product) => {
    totals.byProduct[product] = { units: 0, boxes: 0, count: 0 };
    tableData.dates.forEach((date) => {
      tableData.destinations.forEach((dest) => {
        const data = tableData.data[date][dest][product];
        totals.byProduct[product].units += data.units;
        totals.byProduct[product].boxes += data.boxes;
        totals.byProduct[product].count += data.count;
      });
    });
  });

  // 总合计
  tableData.destinations.forEach((dest) => {
    totals.grand.units += totals.byDestination[dest].units;
    totals.grand.boxes += totals.byDestination[dest].boxes;
    totals.grand.count += totals.byDestination[dest].count;
  });

  return totals;
}

// 生成打印用HTML
function generatePrintHtml(tableData, startDate, endDate) {
  const productNames = tableData.products.map((p) => p.name).join("、");
  const period = `${startDate} ～ ${endDate}`;

  // 1. Pivot the data to match the frontend display
  const pivotRows = [];
  const destinationSpans = {};

  tableData.destinations.forEach((dest) => {
    const productRows = [];
    tableData.products.forEach((product) => {
      const rowData = {
        destination: dest,
        productName: product.name,
        productCd: product.cd,
        data: {},
      };
      let hasData = false;
      tableData.dates.forEach((date) => {
        const cellData = tableData.data[date]?.[dest]?.[product.cd] || [];
        rowData.data[date] = cellData;
        if (cellData.length > 0) {
          hasData = true;
        }
      });
      if (hasData) {
        productRows.push(rowData);
      }
    });

    if (productRows.length > 0) {
      destinationSpans[dest] = productRows.length;
      pivotRows.push(...productRows);
    }
  });

  // 2. Generate table body HTML from pivot data
  let tableBodyHtml = "";
  let rowCount = 0;
  for (let i = 0; i < pivotRows.length; i++) {
    const row = pivotRows[i];
    tableBodyHtml += "<tr>";

    // Destination cell with rowspan
    if (i === 0 || row.destination !== pivotRows[i - 1].destination) {
      const rowspan = destinationSpans[row.destination];
      tableBodyHtml += `<td class="destination-cell" rowspan="${rowspan}">${row.destination}</td>`;
    }

    // Product name cell
    tableBodyHtml += `<td class="product-cell">${row.productName}</td>`;

    // Data cells for each date
    tableData.dates.forEach((date) => {
      const cellData = row.data[date];
      if (cellData && cellData.length > 0) {
        tableBodyHtml += "<td class='data-cell'>";
        cellData.forEach((item) => {
          tableBodyHtml += `<div>${item.boxes}箱</div>`;
        });
        tableBodyHtml += "</td>";
      } else {
        tableBodyHtml += "<td class='data-cell'>-</td>";
      }
    });

    tableBodyHtml += "</tr>";
    rowCount++;
  }

  // 3. Construct the final HTML
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>溶接出荷管理表</title>
      <meta charset="utf-8">
      <style>
        @page {
          size: A4 landscape;
          margin: 10mm;
        }
        body {
          font-family: '游ゴシック', 'Arial', 'Hiragino Sans', 'Meiryo', sans-serif;
          margin: 0;
          padding: 0;
          font-size: 11px;
          color: black;
          background: white;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #333;
        }
        .title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        .period {
          font-size: 14px;
          margin-bottom: 5px;
        }
        .products {
          font-size: 12px;
          color: #666;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          font-size: 10px;
        }
        th, td {
          border: 1px solid #333;
          padding: 3px;
          text-align: center;
          vertical-align: middle;
        }
        th {
          background-color: #f0f0f0;
          font-weight: bold;
          font-size: 9px;
        }
        .destination-header {
          background-color: #e8e8e8;
          font-weight: bold;
          writing-mode: vertical-rl;
          text-orientation: mixed;
          width: 30px;
        }
        .date-header {
          background-color: #f5f5f5;
          transform: rotate(-45deg);
          height: 60px;
          min-width: 40px;
          font-size: 8px;
        }
        .total-row {
          background-color: #fff2cc;
          font-weight: bold;
        }
        .total-cell {
          background-color: #ffeb9c;
          font-weight: bold;
        }
        .product-group {
          margin-bottom: 15px;
        }
        .product-title {
          background-color: #d5e8d4;
          font-weight: bold;
          text-align: center;
          padding: 5px;
          margin-bottom: 5px;
        }
        .units { color: #c41e3a; }
        .boxes { color: #2e75b6; }
        .count { color: #70ad47; }
        .footer {
          margin-top: 20px;
          text-align: right;
          font-size: 10px;
          color: #666;
        }
        @media print {
          .no-print { display: none; }
          body { margin: 0; }
        }
        .destination-cell {
          font-weight: bold;
          text-align: left;
          vertical-align: middle;
        }
        .product-cell {
          text-align: left;
          vertical-align: middle;
        }
        .data-cell {
          text-align: center;
          vertical-align: middle;
        }
        .data-cell div {
          margin-bottom: 2px;
        }
        .page-break {
          page-break-after: always;
        }
        .no-print {
          display: none;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">溶接出荷管理表</div>
        <div class="period">期間: ${period}</div>
        <div class="products">対象製品: ${productNames}</div>
      </div>

      <table>
        <thead>
          <tr>
            <th>納入先</th>
            <th>製品名</th>
            ${tableData.dates.map((date) => `<th>${formatDateHeader(date)}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${tableBodyHtml}
        </tbody>
      </table>

      <div class="footer">
        出力日時: ${new Date().toLocaleString("ja-JP")}
      </div>
      <div class="no-print">
        <button onclick="window.print()">印刷</button>
        <button onclick="window.close()">閉じる</button>
      </div>
    </body>
    </html>
  `;

  return html;
}

function formatDateHeader(date) {
  const d = new Date(date);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
