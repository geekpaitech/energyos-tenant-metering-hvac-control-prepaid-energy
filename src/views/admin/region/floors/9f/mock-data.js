/**
 * 9F 模拟数据（公共区域 3 个落位，接真实接口后按 addressId 替换）
 */

export const MOCK_ADDRESS = {
  id: '2052371980890431499',
  name: '9F',
  display: '9F'
}

/** 公共区域：北过道 + 墙侧筒灯 + 长条灯（与 10F 同组坐标） */
export const MOCK_PLACEMENTS = [
  { id: '9053664024598437889', deviceId: '9051889474768494594', config: '{"data":{"text":"北过道＋小过道","x":1070.929431431162,"y":532.8073400547324}}' },
  { id: '9054020418312888321', deviceId: '9054007940510146567', config: '{"data":{"text":"公共空间墙侧筒灯","x":1187.621945142371,"y":459.4529477546953}}' },
  { id: '9054020490014515201', deviceId: '9054007940510146566', config: '{"data":{"text":"公共空间长条灯","x":1187.121945142371,"y":519.5382188577938}}' }
]

function dev (id, name, deviceNo, on, uploadTime) {
  return {
    id,
    deviceName: name,
    alias: name,
    deviceNo,
    sn: deviceNo,
    addressName: '9F',
    dataPropertyList: on == null ? null : [{
      identifier: 'C',
      data: !!on,
      name: '开关控制'
    }],
    commonDeviceData: uploadTime ? { uploadTime } : null,
    lastUpdateTime: uploadTime || ''
  }
}

export const MOCK_DEVICE_GROUPS = [
  {
    deviceType: 6,
    deviceInfoList: [
      dev('9051889474768494594', '北过道＋小过道', 'LCB04', false, '2026-05-19 13:03:41'),
      dev('9054007940510146566', '公共空间长条灯', '24e124782f501238-C1', false, '2026-05-19 12:54:35'),
      dev('9054007940510146567', '公共空间墙侧筒灯', '24e124782f501238-C3', false, '2026-05-19 12:54:35')
    ]
  }
]
