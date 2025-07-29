// 简单的路径编译器，替代path-to-regexp
export function compile (path) {
  return function (params = {}) {
    let compiledPath = path
    for (const key in params) {
      const regex = new RegExp(`:${key}`, 'g')
      compiledPath = compiledPath.replace(regex, params[key])
    }
    return compiledPath
  }
}

export default {
  compile
}
