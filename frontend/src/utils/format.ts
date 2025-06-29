export function formatNumber(value: number): string {
  return value?.toLocaleString('ja-JP', { minimumFractionDigits: 0, maximumFractionDigits: 4 }) ?? '';
}


export const formatThousand = (num: number): string => {
  if (num === null || num === undefined || isNaN(num)) return '0'
  return num.toLocaleString('en-US') // or use 'ja-JP' for Japanese grouping
}
