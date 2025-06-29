// 测试印刷记录API
const fetch = require("node-fetch");

async function testPrintRecordAPI() {
  try {
    console.log("测试印刷记录API...");

    const response = await fetch("http://localhost:3000/api/shipping/print-record", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        shipping_numbers: ["TEST-001", "TEST-002"],
      }),
    });

    const result = await response.json();
    console.log("API响应:", result);

    if (result.success) {
      console.log("✅ API测试成功！");
    } else {
      console.log("❌ API测试失败:", result.message);
    }
  } catch (error) {
    console.error("❌ API测试错误:", error.message);
  }
}

testPrintRecordAPI();
