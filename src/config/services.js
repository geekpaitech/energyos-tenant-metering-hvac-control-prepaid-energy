// 由 vue.config.js 注入。业务模块只读此处，不重复维护域名。
const services = JSON.parse(process.env.VUE_APP_SERVICE_CONFIG)

export const BACKEND_ROOT = services.backendRoot
export const API_BASE_URL = process.env.NODE_ENV === 'development' ? '' : BACKEND_ROOT
export const AI_ROOT = services.aiRoot
export const GRID_ROOT = services.gridRoot
export const EMS_ORIGIN = services.emsOrigin
export const EMS_API_ROOT = `${EMS_ORIGIN}${services.emsApiPath}`
export const FMCS_ROOT = services.fmcsRoot
export const PARKING_OAUTH_URL = services.parkingOauthUrl
export const TENANT_PORTAL_URL = services.tenantPortalUrl
export const PERMISSION_FORMAL_URL = services.permissionFormalUrl
export const REQUEST_TIMEOUT = services.requestTimeout
