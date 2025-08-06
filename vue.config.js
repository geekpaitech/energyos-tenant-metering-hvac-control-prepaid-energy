module.exports = {
  devServer: {
    port: 8080,
    open: true,
    proxy: {
      '/api': {
        target: 'https://foggy.szcloudpulse.com',
        // target: 'https://ebc.ajnelec.net',
        changeOrigin: true,
        secure: true,
        logLevel: 'debug'
      }
    }
  }
}