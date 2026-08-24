import Vue from 'vue'
import VueI18n from 'vue-i18n'
import ElementUI from 'element-ui'
import elementEn from 'element-ui/lib/locale/lang/en'
import elementZh from 'element-ui/lib/locale/lang/zh-CN'
import Cookies from 'js-cookie'
import moment from 'moment'
import zhLayout from '@/lang/zh'
import enLayout from '@/lang/en'
import dashboardZh from '@/lang/dashboard-zh'
import dashboardEn from '@/lang/dashboard-en'
import deviceMenuZh from '@/lang/device-menu-zh'
import deviceMenuEn from '@/lang/device-menu-en'
import deviceElectricityZh from '@/lang/device-electricity-zh'
import deviceElectricityEn from '@/lang/device-electricity-en'
import deviceWaterZh from '@/lang/device-water-zh'
import deviceWaterEn from '@/lang/device-water-en'
import deviceConditioningZh from '@/lang/device-conditioning-zh'
import deviceConditioningEn from '@/lang/device-conditioning-en'
import electricitySharingZh from '@/lang/electricity-sharing-zh'
import electricitySharingEn from '@/lang/electricity-sharing-en'
import watermeterSharingZh from '@/lang/watermeter-sharing-zh'
import watermeterSharingEn from '@/lang/watermeter-sharing-en'
import conditioningSharingZh from '@/lang/conditioning-sharing-zh'
import conditioningSharingEn from '@/lang/conditioning-sharing-en'
import equipmentPowerZh from '@/lang/equipment-power-zh'
import equipmentPowerEn from '@/lang/equipment-power-en'
import chargingReportZh from '@/lang/charging-report-zh'
import chargingReportEn from '@/lang/charging-report-en'
import electricitySankeyZh from '@/lang/electricity-sankey-zh'
import electricitySankeyEn from '@/lang/electricity-sankey-en'
import equipmentWaterZh from '@/lang/equipment-water-zh'
import equipmentWaterEn from '@/lang/equipment-water-en'
import waterSankeyZh from '@/lang/water-sankey-zh'
import waterSankeyEn from '@/lang/water-sankey-en'
import electricityReportZh from '@/lang/electricity-report-zh'
import electricityReportEn from '@/lang/electricity-report-en'
import waterReportZh from '@/lang/water-report-zh'
import waterReportEn from '@/lang/water-report-en'
import subMeteringZh from '@/lang/sub-metering-zh'
import subMeteringEn from '@/lang/sub-metering-en'
import tenantListZh from '@/lang/tenant-list-zh'
import tenantListEn from '@/lang/tenant-list-en'
import tenantDetailZh from '@/lang/tenant-detail-zh'
import tenantDetailEn from '@/lang/tenant-detail-en'
import tenantDevicesZh from '@/lang/tenant-devices-zh'
import tenantDevicesEn from '@/lang/tenant-devices-en'
import energyBillZh from '@/lang/energy-bill-zh'
import energyBillEn from '@/lang/energy-bill-en'
import floatingPriceTenantZh from '@/lang/floating-price-tenant-zh'
import floatingPriceTenantEn from '@/lang/floating-price-tenant-en'
import labelManageZh from '@/lang/label-manage-zh'
import labelManageEn from '@/lang/label-manage-en'
import tenantLevelZh from '@/lang/tenant-level-zh'
import tenantLevelEn from '@/lang/tenant-level-en'
import electricityPlanZh from '@/lang/electricity-plan-zh'
import electricityPlanEn from '@/lang/electricity-plan-en'
import waterPlanZh from '@/lang/water-plan-zh'
import waterPlanEn from '@/lang/water-plan-en'
import servicePlanZh from '@/lang/service-plan-zh'
import servicePlanEn from '@/lang/service-plan-en'
import electricityAdjustmentZh from '@/lang/electricity-adjustment-zh'
import electricityAdjustmentEn from '@/lang/electricity-adjustment-en'
import consumptionBillZh from '@/lang/consumption-bill-zh'
import consumptionBillEn from '@/lang/consumption-bill-en'
import manualBillZh from '@/lang/manual-bill-zh'
import manualBillEn from '@/lang/manual-bill-en'
import floatPriceBillZh from '@/lang/float-price-bill-zh'
import floatPriceBillEn from '@/lang/float-price-bill-en'
import splitBillZh from '@/lang/split-bill-zh'
import splitBillEn from '@/lang/split-bill-en'
import corporateRechargeZh from '@/lang/corporate-recharge-zh'
import corporateRechargeEn from '@/lang/corporate-recharge-en'
import wechatRechargeZh from '@/lang/wechat-recharge-zh'
import wechatRechargeEn from '@/lang/wechat-recharge-en'
import bankJournalZh from '@/lang/bank-journal-zh'
import bankJournalEn from '@/lang/bank-journal-en'
import manualRechargeZh from '@/lang/manual-recharge-zh'
import manualRechargeEn from '@/lang/manual-recharge-en'
import tenantRefundZh from '@/lang/tenant-refund-zh'
import tenantRefundEn from '@/lang/tenant-refund-en'
import fundFlowZh from '@/lang/fund-flow-zh'
import fundFlowEn from '@/lang/fund-flow-en'
import { DEVICE_MENU_TITLE_KEYS } from '@/lang/deviceMenuTitleKeys'
import { ZH_EN_MAP } from '@/lang/staticZhEn'
import { displayDynamicZhInEn, displayBizHybrid } from '@/utils/localeDisplayText'
import 'moment/locale/zh-cn'
import 'moment/locale/en-gb'

Vue.use(VueI18n)

const LOCALE_COOKIE = 'wyy-admin-locale'

const messages = {
  'zh-CN': Object.assign({}, zhLayout, dashboardZh, deviceMenuZh, deviceElectricityZh, deviceWaterZh, deviceConditioningZh, electricitySharingZh, watermeterSharingZh, conditioningSharingZh, equipmentPowerZh, chargingReportZh, electricitySankeyZh, equipmentWaterZh, waterSankeyZh, electricityReportZh, waterReportZh, subMeteringZh, tenantListZh, tenantDetailZh, tenantDevicesZh, energyBillZh, consumptionBillZh, manualBillZh, floatPriceBillZh, splitBillZh, corporateRechargeZh, wechatRechargeZh, bankJournalZh, manualRechargeZh, tenantRefundZh, fundFlowZh, floatingPriceTenantZh, labelManageZh, tenantLevelZh, electricityPlanZh, waterPlanZh, servicePlanZh, electricityAdjustmentZh, elementZh),
  en: Object.assign({}, enLayout, dashboardEn, deviceMenuEn, deviceElectricityEn, deviceWaterEn, deviceConditioningEn, electricitySharingEn, watermeterSharingEn, conditioningSharingEn, equipmentPowerEn, chargingReportEn, electricitySankeyEn, equipmentWaterEn, waterSankeyEn, electricityReportEn, waterReportEn, subMeteringEn, tenantListEn, tenantDetailEn, tenantDevicesEn, energyBillEn, consumptionBillEn, manualBillEn, floatPriceBillEn, splitBillEn, corporateRechargeEn, wechatRechargeEn, bankJournalEn, manualRechargeEn, tenantRefundEn, fundFlowEn, floatingPriceTenantEn, labelManageEn, tenantLevelEn, electricityPlanEn, waterPlanEn, servicePlanEn, electricityAdjustmentEn, elementEn)
}

function readCookieLocale () {
  const v = Cookies.get(LOCALE_COOKIE)
  if (v === 'en' || v === 'zh-CN') return v
  return 'zh-CN'
}

const i18n = new VueI18n({
  locale: readCookieLocale(),
  fallbackLocale: 'zh-CN',
  messages,
  silentTranslationWarn: true
})

function syncMoment () {
  moment.locale(i18n.locale === 'zh-CN' ? 'zh-cn' : 'en')
}

syncMoment()

function syncHtmlLocaleClass (lang) {
  const root = document.documentElement
  if (lang === 'en') root.classList.add('locale-en')
  else root.classList.remove('locale-en')
}

syncHtmlLocaleClass(readCookieLocale())

export function setLocale (lang) {
  if (lang !== 'en' && lang !== 'zh-CN') return
  i18n.locale = lang
  Cookies.set(LOCALE_COOKIE, lang, { expires: 365 })
  syncMoment()
  document.documentElement.setAttribute('lang', lang === 'zh-CN' ? 'zh-CN' : 'en')
  syncHtmlLocaleClass(lang)
  try {
    const router = require('@/router').default
    const t = router.currentRoute && router.currentRoute.meta && router.currentRoute.meta.title
    document.title = getDocumentTitle(t)
  } catch (e) {
    /* router 未就绪时忽略 */
  }
}

Vue.use(ElementUI, {
  i18n: (key, ...values) => i18n.t(key, ...values)
})

Vue.prototype.$localeText = function (text) {
  void this.$i18n.locale
  if (text == null || text === '') return ''
  const deviceKey = DEVICE_MENU_TITLE_KEYS[text]
  if (deviceKey) return this.$t(deviceKey)
  if (this.$i18n.locale === 'zh-CN') return text
  return ZH_EN_MAP[text] || text
}

/** 英文界面：接口/业务中文名 → 拼音截断；中文界面原样 */
Vue.prototype.$displayDynamicName = function (text, maxLen) {
  void this.$i18n.locale
  return displayDynamicZhInEn(text, this.$i18n.locale, maxLen != null ? maxLen : 18)
}

/** 英文界面：业务名中「系统词」走词典，其余中文片段 → 拼音 */
Vue.prototype.$displayBizHybrid = function (text, maxLen) {
  void this.$i18n.locale
  return displayBizHybrid(text, this.$i18n.locale, maxLen != null ? maxLen : 48)
}

export function translateRouteTitle (text) {
  if (text == null || text === '') return ''
  const deviceKey = DEVICE_MENU_TITLE_KEYS[text]
  if (deviceKey) return i18n.t(deviceKey)
  if (i18n.locale === 'zh-CN') return text
  return ZH_EN_MAP[text] || text
}

/** 与 permission 里原 document.title 规则一致（中文保留原空格习惯） */
export function getDocumentTitle (metaTitle) {
  const suffixZh = '数字物宇-物联中台'
  const suffixEn = 'Digital Wuyu IoT'
  if (!metaTitle) {
    return i18n.locale === 'zh-CN' ? ` ${suffixZh}` : suffixEn
  }
  const t = translateRouteTitle(metaTitle)
  return i18n.locale === 'zh-CN' ? `${t} -  ${suffixZh}` : `${t} - ${suffixEn}`
}

export default i18n
