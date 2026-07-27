/** EMS iframe 嵌入页：管理方 ID → EMS projectId（开源版本请替换为实际配置） */
export const EMS_MANAGER_PROJECT_MAP = {
  // 示例：'your-manager-id': 'your-project-id'
}

export function getEmsProjectIdByManagerId (managerId) {
  const id = String(managerId || '').trim()
  if (!id) return ''
  return EMS_MANAGER_PROJECT_MAP[id] || ''
}
