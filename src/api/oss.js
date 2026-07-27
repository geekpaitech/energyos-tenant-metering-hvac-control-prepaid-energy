import request from '@/utils/request'

export function contentOssSts (query) {
  return request({
    url: '/api/ebc-content/oss/sts',
    method: 'post',
    params: query
  })
}
