module.exports = {
  devServer: {
    port: 8080,
    open: true,
    proxy: {
      '/api': {
        target: 'https://foggy.szcloudpulse.com',
        changeOrigin: true,
        secure: true,
        logLevel: 'debug'
      }
    }
  }
}