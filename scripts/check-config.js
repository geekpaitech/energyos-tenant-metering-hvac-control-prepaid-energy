// 只解析本地构建配置和 URL，不登录、不请求后台、不执行设备或财务操作。
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const vm = require('vm')
const { spawnSync } = require('child_process')

const root = path.resolve(__dirname, '..')
const mode = process.argv[2]

if (!mode) {
  for (const targetMode of ['development', 'production', 'test']) {
    const env = { ...process.env }
    delete env.NODE_ENV
    delete env.BABEL_ENV
    const result = spawnSync(process.execPath, [__filename, targetMode], {
      cwd: root,
      env,
      stdio: 'inherit'
    })
    if (result.error) throw result.error
    if (result.status !== 0) process.exit(result.status || 1)
  }
} else {
  assert(['development', 'production', 'test'].includes(mode), 'Unsupported mode')
  const Service = require('@vue/cli-service/lib/Service')
  const service = new Service(root)
  service.setPluginsToSkip({ 'skip-plugins': '@vue/cli-plugin-eslint' })
  service.init(mode)
  const chain = service.resolveChainableWebpackConfig()
  if (mode === 'test') {
    assert.strictEqual(chain.entryPoints.values().length, 0)
    assert(!chain.module.rules.has('eslint'))
    assert(chain.plugins.has('offline-unit-request'))
  } else {
    assert(chain.entryPoints.has('app'))
    assert(!chain.plugins.has('offline-unit-request'))
  }
  const definitions = chain.plugin('define').get('args')[0]['process.env']
  const clientEnv = {}
  Object.keys(definitions).forEach(key => {
    clientEnv[key] = JSON.parse(definitions[key])
  })
  const configured = JSON.parse(clientEnv.VUE_APP_SERVICE_CONFIG)

  const loadClientModule = (relativePath, imports = {}) => {
    const filename = path.join(root, relativePath)
    const { code } = require('@babel/core').transformSync(fs.readFileSync(filename, 'utf8'), {
      filename,
      configFile: false,
      babelrc: false,
      plugins: ['@babel/plugin-transform-modules-commonjs']
    })
    const module = { exports: {} }
    vm.runInNewContext(code, {
      module,
      exports: module.exports,
      process: { env: clientEnv },
      URLSearchParams,
      require (id) {
        assert(Object.prototype.hasOwnProperty.call(imports, id), `Unexpected import: ${id}`)
        return imports[id]
      }
    }, { filename })
    return module.exports
  }

  const exported = loadClientModule('src/config/services.js')
  assert.strictEqual(exported.BACKEND_ROOT, service.projectOptions.devServer.proxy['/api'].target)
  assert.strictEqual(exported.API_BASE_URL, mode === 'development' ? '' : configured.backendRoot)
  assert.strictEqual(exported.API_BASE_URL, clientEnv.VUE_APP_BASE_API)
  assert.strictEqual(exported.EMS_API_ROOT, configured.emsOrigin + configured.emsApiPath)
  assert.strictEqual(exported.REQUEST_TIMEOUT, configured.requestTimeout)
  assert(Number.isFinite(exported.REQUEST_TIMEOUT) && exported.REQUEST_TIMEOUT > 0)
  for (const key of ['BACKEND_ROOT', 'AI_ROOT', 'GRID_ROOT', 'EMS_ORIGIN', 'FMCS_ROOT',
    'PARKING_OAUTH_URL', 'TENANT_PORTAL_URL', 'PERMISSION_FORMAL_URL']) {
    const url = new URL(exported[key])
    assert(['http:', 'https:'].includes(url.protocol), `Invalid service URL: ${key}`)
  }
  const imports = { '@/config/services': exported }
  const ai = loadClientModule('src/utils/aiServiceConfig.js', imports)
  assert.strictEqual(ai.getAiApiUrl('api/chat'), configured.aiRoot + '/api/chat')
  assert.strictEqual(ai.getAiApiUrl('/api/chat/stream'), configured.aiRoot + '/api/chat/stream')
  const parking = loadClientModule('src/views/group-screen/utils/parkingOrderSso.js', imports)
  const parkingUrl = parking.buildParkingOrderSsoUrl({ token: 'config-check', parkId: 'example', nonce: 1 })
  assert(parkingUrl.startsWith(configured.parkingOauthUrl + '?'))
  assert.strictEqual(parking.buildParkingOrderSsoUrl({}), '')
  assert(['true', 'false'].includes(clientEnv.VUE_APP_USE_MOCK))
  assert(['true', 'false'].includes(clientEnv.VUE_APP_REGION_USE_MOCK))
  console.log(`[${mode}] 配置检查通过：开发代理、生产地址、上传、EMS、AI、停车入口及 Mock 开关；未发送网络请求。`)
}
