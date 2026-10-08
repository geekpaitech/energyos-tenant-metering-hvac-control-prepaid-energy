/** 供应商评价接口 → 中栏供应商考核列表 */

export const EMPTY_SUPPLIERS = []
export const SUPPLIER_PAGE_SIZE = 20

function num (val) {
  if (val == null || val === '') return null
  const n = Number(val)
  return Number.isNaN(n) ? null : n
}

export function mapProviderEvaluationItems (data) {
  const items = data && Array.isArray(data.items) ? data.items : []
  return items.slice(0, SUPPLIER_PAGE_SIZE).map((item, index) => ({
    id: item.providerEvaluationGUID || item.providerGUID || `supplier-${index}`,
    name: item.providerName ? String(item.providerName).trim() : '--',
    score: num(item.totalScore) != null ? Math.round(num(item.totalScore)) : '--',
    grade: item.level ? String(item.level).trim().toUpperCase() : '--'
  }))
}
