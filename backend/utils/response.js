
export function success(res, data = null, message = "OK") {
  res.status(200).json({
    success: true,
    message,
    data,
  });
}

// 业务失败返回
export function fail(res, message = "エラー", code = 400) {
  res.status(code).json({
    success: false,
    message,
    data: null,
  });
}

// 系统异常返回
export function error(res, err) {
  console.error("サーバーエラー:", err);
  res.status(500).json({
    success: false,
    message: "サーバーエラー",
    data: null,
  });
}



