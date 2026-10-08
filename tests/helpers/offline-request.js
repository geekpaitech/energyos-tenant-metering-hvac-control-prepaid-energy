// 仅由 NODE_ENV=test 的 webpack 配置替换主请求模块。
// 需要验证请求行为的单元测试应显式提供 mock，不能连接真实业务后台。
export default function offlineRequest () {
  throw new Error('单元测试禁止请求真实后台，请为请求行为提供显式 mock')
}
