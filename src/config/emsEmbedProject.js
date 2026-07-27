/** EMS iframe 嵌入页：管理方 ID → EMS projectId（监测四页 / 电力分析同源页） */
export const EMS_MANAGER_PROJECT_MAP = {
  /** 南都广场 */
  1000107: '2067137215477219330',
  /** 经开-机器人产业园 */
  1000178: '2069308829132771329'
}

export function getEmsProjectIdByManagerId (managerId) {
  const id = String(managerId || '').trim()
  if (!id) return ''
  return EMS_MANAGER_PROJECT_MAP[id] || ''
}
