/** 仓库经营管理接口 → 左栏展示结构 */

export const EMPTY_WAREHOUSE = {
  materialCount: null,
  categoryCount: null,
  totalPrice: null,
  categories: []
}

function num (val) {
  if (val == null || val === '') return null
  const n = Number(val)
  return Number.isNaN(n) ? null : n
}

/** 类别占比 → 环图 + 列表（「其他」固定末尾，其余保持接口顺序） */
function mapCategoryRatios (list) {
  if (!Array.isArray(list)) return []
  const rows = list.map(item => ({
    name: item.categoryName ? String(item.categoryName).trim() : '--',
    amount: num(item.totalPrice),
    pct: num(item.percentage) != null ? +Number(item.percentage).toFixed(1) : 0
  })).filter(item => item.name && item.name !== '--')

  const others = rows.filter(item => item.name === '其他')
  const rest = rows.filter(item => item.name !== '其他')
  return [...rest, ...others]
}

export function mapWarehouseManagement (data) {
  if (!data) return { ...EMPTY_WAREHOUSE, categories: [] }

  const categories = mapCategoryRatios(data.categoryRatios)

  return {
    materialCount: num(data.totalMaterialCount),
    categoryCount: num(data.categoryCount),
    totalPrice: num(data.totalPriceSum),
    categories
  }
}
