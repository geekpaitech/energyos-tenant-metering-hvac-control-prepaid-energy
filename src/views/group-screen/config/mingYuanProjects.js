/**
 * 明源物业详情接口专用项目字典。
 *
 * 仅供 PropertyDrilldownDialog 使用，不参与能耗、停车、水电收缴、
 * 设备、消防等其他数据源的查询参数构建。
 */
export const MINGYUAN_PROJECTS = Object.freeze([
  { projectType: '产业园', projectName: 'OPC人工智能产业园' },
  { projectType: '产业园', projectName: '吴中机器人产业园' },
  { projectType: '产业园', projectName: '旺山航天航空产业园' },
  { projectType: '产业园', projectName: '太湖软件园智慧谷园区' },
  { projectType: '产业园', projectName: '滨湖大厦' },

  { projectType: '商办', projectName: '尹山湖水街' },
  { projectType: '商办', projectName: '永旺梦乐城' },
  { projectType: '商办', projectName: '尹东水乡邻里' },
  { projectType: '商办', projectName: '零星项目' },
  { projectType: '商办', projectName: '天鸿大厦' },
  { projectType: '商办', projectName: '吴淞江新邻荟' },
  { projectType: '商办', projectName: '吴郡睦邻坊' },
  { projectType: '商办', projectName: '苏旺商务中心' },
  { projectType: '商办', projectName: '塔韵商务广场' },
  { projectType: '商办', projectName: '石湖金陵广场' },
  { projectType: '商办', projectName: '南都电商园' },

  { projectType: '公寓', projectName: '泾东花园' },
  { projectType: '公寓', projectName: '旺金店' },
  { projectType: '公寓', projectName: '尹中路店' },
  { projectType: '公寓', projectName: '昱鑫公寓' },
  { projectType: '公寓', projectName: '吴淞江邻里中心公寓' },
  { projectType: '公寓', projectName: '先锋广场公寓' },
  { projectType: '公寓', projectName: '观澜逸品' },
  { projectType: '公寓', projectName: '苏旺景苑' },
  { projectType: '公寓', projectName: '综保区集宿楼' }
])

export const MINGYUAN_PROJECT_TYPES = Object.freeze(['产业园', '商办', '公寓'])

export function getMingYuanProjectNames (projectType = '') {
  return MINGYUAN_PROJECTS
    .filter(item => !projectType || item.projectType === projectType)
    .map(item => item.projectName)
}
