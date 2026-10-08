const path = require('path')

// 地址配置统一入口。修改后重启 npm run serve；生产部署需重新 npm run build。
// 根地址不包含 /api；独立服务保留各自地址，详见 docs/CONFIGURATION.md。
const services = {
  backendRoot: 'https://iot-test.geekpartytech.com',
  aiRoot: 'https://ai.geekpartytech.com',
  gridRoot: 'https://grid.geekpartytech.com',
  emsOrigin: 'https://cp-ems.szcloudpulse.com:86',
  emsApiPath: '/prod-api',
  fmcsRoot: 'https://jp.brcon.com.cn',
  parkingOauthUrl: 'https://www.ai2park.cn/#/oauth',
  tenantPortalUrl: 'https://geekpartytech.com/wx/ebc/',
  permissionFormalUrl: 'https://iot.geekpartytech.com/',
  requestTimeout: 10000
}

// 保持现有数据来源：全局 Mock 关闭，区域模块使用原有楼层 Mock。
const features = {
  useMock: false,
  regionUseMock: true
}

// 仅移除根地址末尾的斜杠，页面入口的尾斜杠与 hash 保持原样。
for (const key of ['backendRoot', 'aiRoot', 'gridRoot', 'emsOrigin', 'fmcsRoot']) {
  services[key] = services[key].replace(/\/+$/, '')
}

// Vue CLI 将这些公开配置注入浏览器构建，使开发代理与生产请求使用同一来源。
process.env.VUE_APP_SERVICE_CONFIG = JSON.stringify(services)
process.env.VUE_APP_USE_MOCK = String(features.useMock)
process.env.VUE_APP_REGION_USE_MOCK = String(features.regionUseMock)
// 兼容旧上传入口；业务代码统一从 src/config/services.js 读取。
process.env.VUE_APP_BASE_API = process.env.NODE_ENV === 'development' ? '' : services.backendRoot

module.exports = {
  publicPath: '/',
  devServer: {
    port: 8080,
    open: true,
    https: false,
    proxy: {
      '/api': {
        target: services.backendRoot,
        changeOrigin: true,
        secure: true,
        logLevel: 'debug'
      }
    }
  },

  chainWebpack: config => {
    // 单元测试只编译测试入口，避免连带加载业务应用与浏览器专用依赖。
    // 规范检查继续通过 npm run lint 单独执行。
    if (process.env.NODE_ENV === 'test') {
      config.entryPoints.clear()
      config.module.rules.delete('eslint')
      // 数据工具引用 API 常量时，也不应引入 store/router 或访问真实后台。
      config.plugin('offline-unit-request').use(
        require('webpack').NormalModuleReplacementPlugin,
        [/^@\/utils\/request$/, path.resolve(__dirname, 'tests/helpers/offline-request.js')]
      )
    }

    // Windows路径兼容性处理
    config.module
      .rule('svg')
      .exclude.add(resource => {
        // 使用path.normalize处理路径分隔符
        const normalizedResource = path.normalize(resource)
        return /assets[\\\/]images[\\\/]floors/.test(normalizedResource)
      })
      .end()

    config.module
      .rule('floors-svg')
      .test(/\.svg$/)
      .include.add(resource => {
        const normalizedResource = path.normalize(resource)
        return /assets[\\\/]images[\\\/]floors/.test(normalizedResource)
      })
      .end()
      .use('url-loader')
      .loader('url-loader')
      .options({
        limit: 10000,
        name: 'img/[name].[hash:8].[ext]'
      })
  },

  pwa: {
    iconPaths: {
      faviconSVG: null,
      favicon32: 'favicon.ico',
      favicon16: 'favicon.ico',
      appleTouchIcon: 'favicon.ico',
      maskIcon: 'favicon.ico',
      msTileImage: 'favicon.ico'
    }
  }
}
