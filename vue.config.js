module.exports = {
  devServer: {
    port: 8080,
    open: true,
    proxy: {
      '/api': {
        target: 'https://iot-console.ajnelec.net',
        changeOrigin: true,
        secure: true,
        logLevel: 'debug'
      }
    }
  },
  
  // 最简单有效的 PWA 图标配置
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