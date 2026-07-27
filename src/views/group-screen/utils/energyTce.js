/**
 * 综合能耗折标煤系数（GB/T 2589-2020 参考值，换算为 tce）
 * 电 kWh · 天然气 m³ · 水 m³(≈t) · 煤/其他 kg
 */
export const ENERGY_TCE_COEFF = {
  electricity: 0.0001229,
  naturalGas: 1.33 / 1000,
  water: 0.2571 / 1000,
  coal: 0.7143 / 1000
}

/** 分项物理量 → 折标煤 tce */
export function calcSubItemTce (sub = {}) {
  const elec = Number(sub.electricityValue) || 0
  const water = Number(sub.waterValue) || 0
  const gas = Number(sub.gasValue) || 0
  const other = Number(sub.otherValue) || 0
  return {
    electricity: elec * ENERGY_TCE_COEFF.electricity,
    water: water * ENERGY_TCE_COEFF.water,
    gas: gas * ENERGY_TCE_COEFF.naturalGas,
    other: other * ENERGY_TCE_COEFF.coal
  }
}

/** 折标煤结构占比（条形图宽度用，可比口径） */
export function calcTceSharePct (tceParts) {
  const total = Object.values(tceParts).reduce((s, v) => s + v, 0)
  if (!total) {
    return { electricity: 0, water: 0, gas: 0, other: 0 }
  }
  const pct = v => +((v / total) * 100).toFixed(1)
  return {
    electricity: pct(tceParts.electricity),
    water: pct(tceParts.water),
    gas: pct(tceParts.gas),
    other: pct(tceParts.other)
  }
}
