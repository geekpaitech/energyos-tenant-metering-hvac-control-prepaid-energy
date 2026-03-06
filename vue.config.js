const path = require('path')

module.exports = {
  devServer: {
    port: 8080,
    open: true,
    proxy: {
      '/api': {
        target: 'https://iot.geekpartytech.com',
        changeOrigin: true,
        secure: true,
        logLevel: 'debug'
      }
    }
  },
  
  chainWebpack: config => {
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