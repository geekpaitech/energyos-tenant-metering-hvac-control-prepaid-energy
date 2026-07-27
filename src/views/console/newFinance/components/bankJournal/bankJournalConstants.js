/** 银企直连收款银行枚举（value 与后端一致） */
export const BANK_OF_CHINA = 0
export const BANK_OF_PUFA = 1
export const BANK_OF_CHINASHUZI = 2
export const BANK_OF_CMB = 3
export const BANK_OF_NB = 4

/** labelKey 对应 i18n bankJournalPage.* */
export const BANK_TYPE_DEFS = [
  { value: BANK_OF_CHINA, labelKey: 'bankBankOfChina' },
  { value: BANK_OF_PUFA, labelKey: 'bankPufa' },
  { value: BANK_OF_CHINASHUZI, labelKey: 'bankBocDigital' },
  { value: BANK_OF_CMB, labelKey: 'bankCmb' },
  { value: BANK_OF_NB, labelKey: 'bankNbAsset' }
]

/** @param $t 须为 (key) => vm.$t(key)，勿直接传 vm.$t（会失去 this） */
export function bankTypeLabel (code, $t) {
  if (code === '' || code === null || code === undefined) return '-'
  const hit = BANK_TYPE_DEFS.find(
    (b) => b.value === code || String(b.value) === String(code)
  )
  return hit ? $t(`bankJournalPage.${hit.labelKey}`) : String(code)
}

export const STATUS_DEFS = [
  { value: 0, labelKey: 'statusPending', tag: 'warning' },
  { value: 1, labelKey: 'statusDone', tag: 'success' },
  { value: 2, labelKey: 'statusVoided', tag: 'info' },
  { value: 3, labelKey: 'statusRefunding', tag: 'warning' },
  { value: 4, labelKey: 'statusRefunded', tag: 'success' }
]

export const TYPE_DEFS = [
  { value: '0', labelKey: 'typeCharge' },
  { value: '1', labelKey: 'typeRefund' }
]

export function defaultDateRange () {
  const end = new Date()
  const start = new Date()
  start.setMonth(start.getMonth() - 5)
  const fmt = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return [fmt(start), fmt(end)]
}
