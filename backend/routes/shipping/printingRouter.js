import express from "express";
import puppeteer from "puppeteer";
import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// 打印出荷予定表
router.post("/shipping-overview", async (req, res) => {
  try {
    const { data, filters, printerName } = req.body;

    // 生成HTML内容
    const htmlContent = generateShippingOverviewHTML(data, filters);

    // 使用Puppeteer生成PDF
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      dumpio: true,
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    // 设置打印选项
    const pdfOptions = {
      format: "A4",
      landscape: true,
      margin: {
        top: "1cm",
        right: "1cm",
        bottom: "1cm",
        left: "1cm",
      },
      printBackground: true,
      preferCSSPageSize: true,
    };

    // 生成PDF
    const pdfBuffer = await page.pdf(pdfOptions);
    await browser.close();

    // 如果指定了打印机，直接打印
    if (printerName) {
      const success = await printToPrinter(pdfBuffer, printerName, "shipping-overview");
      if (success) {
        res.json({ success: true, message: "打印成功" });
      } else {
        res.status(500).json({ success: false, message: "打印失败" });
      }
    } else {
      // 返回PDF供下载
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=shipping-overview.pdf");
      res.send(pdfBuffer);
    }
  } catch (error) {
    console.error("打印出荷予定表失败:", error);
    res.status(500).json({ success: false, message: "打印失败", error: error.message });
  }
});

// 打印出荷品報告書
router.post("/shipping-report", async (req, res) => {
  try {
    const { data, filters, printerName } = req.body;

    // 生成HTML内容
    const htmlContent = generateShippingReportHTML(data, filters);

    // 使用Puppeteer生成PDF
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      dumpio: true,
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    // 设置打印选项
    const pdfOptions = {
      format: "A4",
      landscape: false, // 竖向
      margin: {
        top: "2cm",
        right: "2cm",
        bottom: "2cm",
        left: "2cm",
      },
      printBackground: true,
      preferCSSPageSize: true,
    };

    // 生成PDF
    const pdfBuffer = await page.pdf(pdfOptions);
    await browser.close();

    // 如果指定了打印机，直接打印
    if (printerName) {
      const success = await printToPrinter(pdfBuffer, printerName, "shipping-report");
      if (success) {
        res.json({ success: true, message: "报告打印成功" });
      } else {
        res.status(500).json({ success: false, message: "报告打印失败" });
      }
    } else {
      // 返回PDF供下载
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=shipping-report.pdf");
      res.send(pdfBuffer);
    }
  } catch (error) {
    console.error("打印出荷品報告書失败:", error);
    res.status(500).json({ success: false, message: "报告打印失败", error: error.message });
  }
});

// 获取可用打印机列表
router.get("/printers", async (req, res) => {
  try {
    const printers = await getAvailablePrinters();
    res.json({ success: true, printers });
  } catch (error) {
    console.error("获取打印机列表失败:", error);
    res.status(500).json({ success: false, message: "获取打印机列表失败" });
  }
});

// 生成出荷予定表HTML
function generateShippingOverviewHTML(data, filters) {
  const printDateTime = new Date().toLocaleString("ja-JP");

  // 按出荷日分组数据
  const groupedData = groupByShippingDate(data);

  let pagesHTML = "";

  groupedData.forEach((dateGroup) => {
    const formattedDate = formatDate(dateGroup.shipping_date);

    pagesHTML += `
      <div class="page-container">
        <!-- 打印头部 -->
        <div class="print-header">
          <div class="header-left">
            <span>印刷日時:</span>
            <span>${printDateTime}</span>
          </div>
          <div class="header-center">
            <h1 class="print-title">出荷予定表</h1>
          </div>
          <div class="header-right">
            <span>出荷日:</span>
            <span>${formattedDate}</span>
          </div>
        </div>

        <!-- 打印中部 - 三列布局 -->
        <div class="print-body">
          ${generateColumnsHTML(dateGroup.destinations)}
        </div>
      </div>
    `;
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>出荷予定表</title>
      <style>
        ${getShippingOverviewCSS()}
      </style>
    </head>
    <body>
      <div class="shipping-overview-print">
        ${pagesHTML}
      </div>
    </body>
    </html>
  `;
}

// 生成出荷品報告書HTML
function generateShippingReportHTML(data, filters) {
  const printDateTime = new Date().toLocaleString("ja-JP");
  const dateRange = formatDateRange(filters.dateRange);

  // 按納入先分组数据
  const groupedData = groupByDestination(data);

  let sectionsHTML = "";

  groupedData.forEach((destGroup) => {
    sectionsHTML += `
      <div class="destination-section">
        <h2 class="destination-title">${destGroup.destination_name}</h2>
        <table class="report-table">
          <thead>
            <tr>
              <th>出荷No</th>
              <th>製品名</th>
              <th>箱タイプ</th>
              <th>受注数</th>
              <th>受注本数</th>
              <th>納入日</th>
            </tr>
          </thead>
          <tbody>
            ${destGroup.items
              .map(
                (item) => `
              <tr>
                <td>${item.shipping_no}</td>
                <td>${item.product_name}</td>
                <td>${item.box_type || "-"}</td>
                <td>${item.quantity}</td>
                <td>${item.units || "-"}</td>
                <td>${formatDate(item.delivery_date)}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>

        <div class="destination-summary">
          <table class="summary-table">
            <tr>
              <td class="summary-label">${destGroup.destination_name} 合計</td>
              <td class="summary-value">受注数: ${destGroup.totalQuantity}</td>
              <td class="summary-value">受注本数: ${destGroup.totalUnits}</td>
              <td class="summary-value">出荷No件数: ${destGroup.shippingNoCount}</td>
            </tr>
          </table>
          <div class="separator-line"></div>
        </div>
      </div>
    `;
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>出荷品報告書</title>
      <style>
        ${getShippingReportCSS()}
      </style>
    </head>
    <body>
      <div class="shipping-report">
        <div class="report-header">
          <div class="header-left">
            <span>出荷日: ${dateRange}</span>
          </div>
          <div class="header-center">
            <h1 class="report-title">出荷品報告書</h1>
          </div>
          <div class="header-right">
            <span>印刷日時: ${printDateTime}</span>
          </div>
        </div>

        <div class="report-body">
          ${sectionsHTML}
        </div>
      </div>
    </body>
    </html>
  `;
}

// 获取出荷予定表CSS样式
function getShippingOverviewCSS() {
  return `
    @page {
      size: A4 landscape;
      margin: 1cm;
    }

    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    .shipping-overview-print {
      font-family: 'Arial', 'MS Gothic', sans-serif;
      color: #000;
      background: #fff;
      line-height: 1.3;
      font-size: 14px;
      width: 100%;
      height: 100%;
    }

    .page-container {
      page-break-after: always;
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100%;
      position: relative;
      padding: 0;
      margin: 0;
    }

    .page-container:last-child {
      page-break-after: auto;
    }

    .print-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #000;
      padding: 10px 0;
      margin-bottom: 15px;
      font-size: 14px;
      background: #f5f5f5;
      width: 100%;
    }

    .header-left,
    .header-right {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 0 10px;
      min-width: 150px;
      font-size: 14px;
    }

    .header-left span:first-child,
    .header-right span:first-child {
      font-weight: bold;
      color: #000;
      font-size: 12px;
    }

    .header-center {
      flex-grow: 1;
      text-align: center;
      padding: 0 15px;
    }

    .print-title {
      font-size: 22px;
      font-weight: bold;
      margin: 0;
      color: #000;
      text-align: center;
    }

    .print-body {
      display: flex;
      gap: 10px;
      align-items: flex-start;
      flex-grow: 1;
      width: 100%;
      padding: 0;
    }

    .column {
      flex: 1;
      min-width: 0;
      background: #fff;
      padding: 5px;
      border: 1px solid #ddd;
    }

    .destination-group {
      margin-bottom: 12px;
      page-break-inside: avoid;
      background: #fff;
      border: 1px solid #000;
    }

    .destination-name {
      font-size: 14px;
      font-weight: bold;
      padding: 8px 10px;
      background: #e0e0e0;
      color: #000;
      margin: 0;
      border-bottom: 1px solid #000;
      text-align: center;
    }

    .print-table {
      width: 100%;
      border-collapse: collapse;
      background: #fff;
      border: 1px solid #000;
    }

    .print-table th {
      background: #f0f0f0;
      color: #000;
      font-weight: bold;
      font-size: 14px;
      border: 1px solid #000;
      padding: 6px 4px;
      text-align: center;
    }

    .print-table td {
      border: 1px solid #000;
      padding: 5px 4px;
      font-size: 14px;
      text-align: left;
      vertical-align: middle;
      background: #fff;
    }

    .print-table tbody tr:nth-child(even) td {
      background: #f9f9f9;
    }

    .checkbox-cell {
      width: 40px;
      text-align: center;
      vertical-align: middle;
      padding: 5px;
    }

    .checkbox {
      width: 16px;
      height: 16px;
      border: 2px solid #000;
      display: inline-block;
      background: #fff;
    }
  `;
}

// 获取出荷品報告書CSS样式
function getShippingReportCSS() {
  return `
    @page {
      size: A4 portrait;
      margin: 2cm;
    }

    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    .shipping-report {
      font-family: 'Arial', 'MS Gothic', sans-serif;
      color: #000;
      background: #fff;
      line-height: 1.5;
      font-size: 14px;
      width: 100%;
    }

    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #000;
      padding: 15px 0;
      margin-bottom: 25px;
      font-size: 14px;
      background: #f5f5f5;
    }

    .header-left,
    .header-right {
      flex: 1;
      padding: 0 10px;
      font-weight: bold;
      color: #000;
    }

    .header-center {
      flex: 2;
      text-align: center;
      padding: 0 15px;
    }

    .report-title {
      font-size: 24px;
      font-weight: bold;
      margin: 0;
      color: #000;
    }

    .destination-section {
      margin-bottom: 25px;
      page-break-inside: avoid;
      background: #fff;
      border: 1px solid #000;
    }

    .destination-title {
      font-size: 16px;
      font-weight: bold;
      margin: 0;
      padding: 12px 15px;
      background: #e0e0e0;
      color: #000;
      border-bottom: 1px solid #000;
    }

    .report-table {
      width: 100%;
      border-collapse: collapse;
      background: #fff;
    }

    .report-table th {
      background: #f0f0f0;
      color: #000;
      font-weight: bold;
      font-size: 12px;
      border: 1px solid #000;
      padding: 8px 6px;
      text-align: center;
    }

    .report-table td {
      border: 1px solid #000;
      padding: 6px;
      font-size: 11px;
      text-align: left;
      vertical-align: middle;
      background: #fff;
    }

    .report-table tbody tr:nth-child(even) td {
      background: #f9f9f9;
    }

    .destination-summary {
      margin: 0;
      padding: 10px 15px;
      background: #f5f5f5;
      border-top: 1px solid #000;
    }

    .summary-table {
      width: 100%;
      border-collapse: collapse;
    }

    .summary-table td {
      padding: 6px 8px;
      font-weight: bold;
      font-size: 12px;
      border: none;
      background: transparent;
      color: #000;
    }

    .separator-line {
      width: 100%;
      height: 2px;
      background: #000;
      margin-top: 8px;
    }
  `;
}

// 辅助函数
function groupByShippingDate(data) {
  const dateMap = new Map();

  data.forEach((item) => {
    if (!dateMap.has(item.shipping_date)) {
      dateMap.set(item.shipping_date, new Map());
    }
    const destMap = dateMap.get(item.shipping_date);

    if (!destMap.has(item.destination_name)) {
      destMap.set(item.destination_name, []);
    }
    destMap.get(item.destination_name).push(item);
  });

  const result = [];
  dateMap.forEach((destMap, shipping_date) => {
    const destinations = [];
    destMap.forEach((items, destination_name) => {
      destinations.push({ destination_name, items });
    });
    result.push({ shipping_date, destinations });
  });

  return result.sort((a, b) => new Date(a.shipping_date) - new Date(b.shipping_date));
}

function groupByDestination(data) {
  const destMap = new Map();

  data.forEach((item) => {
    const destName = item.destination_name;
    if (!destMap.has(destName)) {
      destMap.set(destName, []);
    }
    destMap.get(destName).push(item);
  });

  const result = [];
  destMap.forEach((items, destination_name) => {
    const sortedItems = items.sort((a, b) => a.product_name.localeCompare(b.product_name));
    const totalQuantity = sortedItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const totalUnits = sortedItems.reduce((sum, item) => sum + (Number(item.units) || 0), 0);
    const uniqueShippingNos = new Set(sortedItems.map((item) => item.shipping_no));
    const shippingNoCount = uniqueShippingNos.size;

    result.push({
      destination_name,
      items: sortedItems,
      totalQuantity,
      totalUnits,
      shippingNoCount,
    });
  });

  return result.sort((a, b) => a.destination_name.localeCompare(b.destination_name));
}

function generateColumnsHTML(destinations) {
  const columns = [[], [], []];
  destinations.forEach((dest, index) => {
    columns[index % 3].push(dest);
  });

  return columns
    .map(
      (column) => `
    <div class="column">
      ${column
        .map(
          (dest) => `
        <div class="destination-group">
          <h2 class="destination-name">${dest.destination_name}</h2>
          <table class="print-table">
            <thead>
              <tr>
                <th>製品名</th>
                <th>数量</th>
                <th>出荷No</th>
                <th>確認</th>
              </tr>
            </thead>
            <tbody>
              ${dest.items
                .map(
                  (item) => `
                <tr>
                  <td>${item.product_name}</td>
                  <td>${item.quantity} 箱</td>
                  <td>${item.shipping_no}</td>
                  <td class="checkbox-cell">
                    <span class="checkbox"></span>
                  </td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `,
        )
        .join("")}
    </div>
  `,
    )
    .join("");
}

function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  const options = { year: "numeric", month: "long", day: "numeric", weekday: "long" };
  return date.toLocaleDateString("ja-JP-u-ca-japanese", options);
}

function formatDateRange(dateRange) {
  if (!dateRange || dateRange.length !== 2) return "N/A";
  if (dateRange[0] === dateRange[1]) {
    return formatDate(dateRange[0]);
  }
  return `${formatDate(dateRange[0])} ~ ${formatDate(dateRange[1])}`;
}

// 打印到指定打印机
async function printToPrinter(pdfBuffer, printerName, jobName) {
  try {
    const tempFilePath = path.join(process.cwd(), "temp", `${jobName}-${Date.now()}.pdf`);

    // 确保temp目录存在
    await fs.mkdir(path.dirname(tempFilePath), { recursive: true });

    // 保存PDF到临时文件
    await fs.writeFile(tempFilePath, pdfBuffer);

    // 根据操作系统选择打印命令
    let printCommand;
    if (process.platform === "win32") {
      // Windows: 使用 'PrintTo' 动作，并传入打印机名称
      // 这依赖于系统的默认PDF查看器支持 'PrintTo' 动作
      printCommand = `powershell -Command "Start-Process -FilePath '${tempFilePath}' -Verb PrintTo -ArgumentList '${printerName}' -WindowStyle Hidden"`;
    } else if (process.platform === "darwin") {
      // macOS
      printCommand = `lpr -P "${printerName}" "${tempFilePath}"`;
    } else {
      // Linux
      printCommand = `lp -d "${printerName}" "${tempFilePath}"`;
    }

    console.log(`Executing print command for platform ${process.platform}:`);
    console.log(printCommand);

    return new Promise((resolve) => {
      exec(printCommand, (error, stdout, stderr) => {
        // 删除临时文件
        fs.unlink(tempFilePath).catch(console.error);

        if (error) {
          console.error("打印命令执行失败:", error);
          console.error("Stderr:", stderr);
          console.error("Stdout:", stdout);
          resolve(false);
        } else {
          console.log("打印成功:", stdout);
          resolve(true);
        }
      });
    });
  } catch (error) {
    console.error("打印到打印机失败:", error);
    return false;
  }
}

// 获取可用打印机列表
async function getAvailablePrinters() {
  try {
    // 首先尝试读取配置文件
    const configPath = path.join(__dirname, "../../config/printers.json");
    let config = null;

    try {
      const configContent = await fs.readFile(configPath, "utf8");
      config = JSON.parse(configContent);
      console.log("读取到打印机配置:", config);
    } catch (configError) {
      console.log("无法读取打印机配置文件，将使用自动检测:", configError.message);
    }

    // 如果配置文件存在且禁用了自动检测，直接返回配置的打印机
    if (config && !config.autoDetect) {
      console.log("使用配置文件中的打印机列表");
      return config.printers || [];
    }

    // 尝试自动检测打印机
    let command;
    if (process.platform === "win32") {
      // Windows - 使用PowerShell命令替代wmic
      command = `powershell -Command "Get-Printer | Select-Object -ExpandProperty Name"`;
    } else if (process.platform === "darwin") {
      // macOS
      command = "lpstat -p | awk '{print $2}'";
    } else {
      // Linux
      command = "lpstat -p | awk '{print $2}'";
    }

    return new Promise((resolve) => {
      exec(command, { encoding: "utf8" }, (error, stdout, stderr) => {
        if (error) {
          console.error("获取打印机列表失败:", error);
          console.error("stderr:", stderr);

          // Windows 备用方案：尝试使用 wmic
          if (process.platform === "win32") {
            console.log("尝试使用 wmic 备用方案...");
            exec(
              "wmic printer get name /format:csv",
              { encoding: "utf8" },
              (wmicError, wmicStdout, wmicStderr) => {
                if (wmicError) {
                  console.error("wmic 也失败了:", wmicError);
                  // 使用配置文件的备用打印机或默认打印机
                  const fallbackPrinters = config?.fallbackPrinters || [
                    "Microsoft Print to PDF",
                    "Microsoft XPS Document Writer",
                    "Fax",
                  ];
                  console.log("使用备用打印机列表:", fallbackPrinters);
                  resolve(fallbackPrinters);
                } else {
                  const printers = wmicStdout
                    .split("\n")
                    .filter((line) => line.trim())
                    .map((line) => line.trim())
                    .filter((name) => name && name !== "Name" && name !== "Node,Name");
                  resolve(printers);
                }
              },
            );
          } else {
            // 非Windows系统，使用配置文件的备用打印机
            const fallbackPrinters = config?.fallbackPrinters || [];
            resolve(fallbackPrinters);
          }
        } else {
          console.log("打印机命令输出:", stdout);
          const printers = stdout
            .split("\n")
            .filter((line) => line.trim())
            .map((line) => line.trim())
            .filter((name) => name && name !== "Name" && name !== "Node,Name");

          console.log("解析后的打印机列表:", printers);

          // 如果自动检测的结果为空，使用配置文件的备用打印机
          if (printers.length === 0 && config?.fallbackPrinters) {
            console.log("自动检测结果为空，使用备用打印机列表");
            resolve(config.fallbackPrinters);
          } else {
            resolve(printers);
          }
        }
      });
    });
  } catch (error) {
    console.error("获取打印机列表失败:", error);
    return ["Microsoft Print to PDF", "Microsoft XPS Document Writer"];
  }
}

export default router;
