// 获取 fromDate 到 toDate 的所有日期数组（含头尾）
export function getDateRange(fromDateStr, toDateStr) {
  const dates = [];
  const current = new Date(fromDateStr);
  const end = new Date(toDateStr);

  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

