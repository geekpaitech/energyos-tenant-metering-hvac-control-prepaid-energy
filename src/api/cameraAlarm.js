import request from '@/utils/request'

/**
 * 分页查询 AI 报警记录（后端已排除 streamUrl 和 resultData 字段，带权限校验）
 * @param {Object} data 查询参数对象 CameraAlarmRecordPageReqDto
 */
export function queryCameraAlarmPage (data) {
  return request({
    url: '/api//ebc-content/openapi/alarm/page',
    method: 'post',
    data
  })
}
