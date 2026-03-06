<template>
  <div class="device-Container">
    <div class="title">
      <div class="note"></div>
      <div class="txt">设备分布</div>
    </div>
    <div class="type-list">
      <el-checkbox-group
      v-model="checkList"
      @change="changeChecked"
      >
        <el-checkbox :label="1">电表</el-checkbox>
        <el-checkbox :label="2">水表</el-checkbox>
        <el-checkbox :label="3">空调</el-checkbox>
        <el-checkbox :label="4">照明</el-checkbox>
        <el-checkbox :label="5">门锁</el-checkbox>
      </el-checkbox-group>
    </div>
    <div>
      <div ref="svgDeviceContainer" class="device-wrapper">
      </div>
    </div>
    <el-row style="width: 100%;" :gutter="20">
      <el-col :span="12">
        <temperatureHeatMap></temperatureHeatMap>
      </el-col>
      <el-col :span="12">
        <energyDistribute></energyDistribute>
      </el-col>
    </el-row>
    <el-dialog
      :visible.sync="dialogVisible"
      title="设备详情"
      :modal="false"
      width="358px"
      :style="{

        position: 'fixed',
        left: dialogPosition.x + 'px',
        top: dialogPosition.y + 'px',
        margin: 0,
        transform: 'none'
      }">
      <div class="dialog-header">
        <div class="l">
          <img v-if="dialogData.type === 1" class="img" src="@/assets/images/floors/elec-nor.png"/>
          <img v-else-if="dialogData.type === 2" class="img" src="@/assets/images/floors/water-nor.png"/>
          <img v-else-if="dialogData.type === 3" class="img" src="@/assets/images/floors/air-nor.png"/>
          <img v-else-if="dialogData.type === 4" class="img" src="@/assets/images/floors/light-nor.png"/>
          <img v-else-if="dialogData.type === 5" class="img" src="@/assets/images/floors/lock-nor.png"/>
          <div class="info">
            <div class="label-1">2层厂房{{ typeMap[dialogData.type] }}</div>
            <div class="label-2"><span>131312123444 </span><span class="txt-blue">复制</span></div>
          </div>
        </div>
        <div class="r">
          <div v-if="dialogData.status === 'err'" class="status-item status-item-red">离线</div>
          <div v-else class="status-item status-item-green">在线</div>
          <div class="status-item status-item-blue">专用</div>
        </div>
      </div>
      <div class="dialog-content">
        <div class="item">
          <span class="label-1">控制区域</span>
          <span class="label-2">a-1f-公区</span>
        </div>
        <div class="item">
          <span class="label-1">今日用能</span>
          <span class="label-2">23度</span>
        </div>
        <div class="item">
          <span class="label-1">实时功率</span>
          <span class="label-2">25.6Kw</span>
        </div>
        <div class="item">
          <span class="label-1">最新数据</span>
          <span class="label-2">2025-08-01 10:34:21</span>
        </div>
      </div>
      <div class="dialog-footer" style="justify-content: center; cursor: pointer;" @click="goDetails()">
        <!-- <div class="footer-item">
          <img class="img" src="@/assets/images/floors/icon1.png"/>
          <div class="label">模式</div>
        </div>
        <div class="footer-item">
          <img class="img" src="@/assets/images/floors/icon2.png"/>
          <div class="label">风速</div>
        </div> -->
        <div class="footer-item">
          <img class="img" src="@/assets/images/floors/icon3.png"/>
          <div class="label">详情</div>
        </div>
        <!-- <div class="footer-item">
          <img class="img" src="@/assets/images/floors/icon4.png"/>
          <div class="label">监控</div>
        </div> -->
      </div>
    </el-dialog>
  </div>
</template>

<script>
import Konva from 'konva'
import temperatureHeatMap from './temperatureHeatMap'
import energyDistribute from './energyDistribute'
export default {
  components: {
    temperatureHeatMap,
    energyDistribute
  },
  data () {
    return {
      dialogData: {},
      checkList: [1, 2, 3],
      konvaStage: null,
      layer: null,
      svgLayer: null,
      svgPathData: require('@/assets/images/floors/device.svg'),
      svgWidth: 1140,
      svgHeight: 561,
      svgScale: 1,
      roomTemperatures: {
        'area-a': { temperature: 25 },
        'area-b': { temperature: 32 },
        'area-c': { temperature: 60 },
        'area-e': { temperature: 20 }
      },
      deviceGroups: {},
      deviceLayer: null,
      devices: [
        { id: 1, name: '电表001', type: 1, pathId: 'area-c', X: 60.00, Y: 50.92 },
        { id: 2, name: '水表001', type: 2, pathId: 'area-c', X: 60.00, Y: 100.92 },
        { id: 3, name: '空调001', type: 3, pathId: 'area-c', X: 60.00, Y: 150.92 },
        { id: 4, name: '照明001', type: 4, pathId: 'area-c', X: 60.00, Y: 200.92 },
        { id: 5, name: '门锁001', type: 5, pathId: 'area-c', X: 60.00, Y: 250.92 },
        { id: 6, name: '电表002', type: 1, pathId: 'area-c', X: 100.00, Y: 50.92 },
        { id: 7, name: '水表002', type: 2, pathId: 'area-c', X: 100.00, Y: 100.92 },
        { id: 8, name: '空调002', type: 3, pathId: 'area-c', X: 100.00, Y: 150.92 },
        { id: 9, name: '照明002', type: 4, pathId: 'area-c', X: 100.00, Y: 200.92 },
        { id: 10, name: '门锁002', type: 5, pathId: 'area-c', X: 100.00, Y: 250.92 },
        { id: 11, name: '电表003', type: 1, pathId: 'lift-free', X: 526.00, Y: 50.92 },
        { id: 12, name: '电表004', type: 1, pathId: 'lift-peo', X: 526.00, Y: 107.92 },
        { id: 13, name: '电表005', type: 1, pathId: 'lift-goods', X: 526.00, Y: 161.92 },
        { id: 14, name: '电表006', status: 'err', type: 1, pathId: 'area-a', X: 937.00, Y: 61.92 },
        { id: 15, name: '照明003', type: 4, pathId: 'area-a', X: 937.00, Y: 106.92 },
        { id: 16, name: '照明004', type: 4, pathId: 'area-a', X: 988.00, Y: 106.92 },
        { id: 17, name: '空调003', type: 3, pathId: 'area-a', X: 937.00, Y: 156.92 },
        { id: 18, name: '空调004', type: 3, pathId: 'area-a', X: 988.00, Y: 156.92 },
        { id: 19, name: '门锁003', type: 5, pathId: 'area-a', X: 937.00, Y: 206.92 }
      ],
      dialogVisible: false,
      dialogPosition: {
        x: 0,
        y: 0
      },
      typeMap: {
        1: '电表',
        2: '水表',
        3: '空调',
        4: '照明',
        5: '门锁'
      }
    }
  },
  computed: {
    // svgScale () {
    //   const containerWidth = this.$refs.svgDeviceContainer?.offsetWidth || this.svgWidth
    //   return containerWidth / this.svgWidth // 基于SVG原始宽度1149计算
    // }
  },
  mounted () {
    this.initKonva()
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.applyScale)
    if (this.konvaStage) {
      this.konvaStage.destroy()
    }
  },
  methods: {
    goDetails () {
      // dialogData.type
      // /device/electricity/detail/1022399?name=1F展销大厅-专用表&serial=90010000010001&deviceId=1022399
      const random1 = Math.floor(Math.random() * 2) + 1
      if (this.dialogData.type === 1) {
        if (random1 === 1) {
          this.$router.push({
            path: '/device/electricity/detail/1022399',
            query: {
              name: '1F展销大厅-专用表',
              serial: '90010000010001',
              deviceId: '1022399'
            }
          })
        } else {
          this.$router.push({
            path: '/device/electricity/detail/1022400',
            query: {
              name: '2F会议接待厅-专用表',
              serial: '90010000010002',
              deviceId: '1022400'
            }
          })
        }
      } else if (this.dialogData.type === 2) {
        /// watermeter/detail/1003373?name=1F%E8%8C%B6%E6%B0%B4%E9%97%B4&serial=90020000010001&deviceId=1003373
        /// watermeter/detail/1003374?name=2F茶水间&serial=90020000010002&deviceId=1003374
        if (random1 === 1) {
          this.$router.push({
            path: '/device/watermeter/detail/1003373',
            query: {
              name: '1F茶水间',
              serial: '90020000010001',
              deviceId: '1003373'
            }
          })
        } else {
          this.$router.push({
            path: '/device/watermeter/detail/1003374',
            query: {
              name: '2F茶水间',
              serial: '90020000010002',
              deviceId: '1003374'
            }
          })
        }
      } else if (this.dialogData.type === 3) {
        // conditioning/detail/AC001?name=展销空调-01&building=A&floorArea=1F展销大厅&deviceId=AC001
        // /detail/AC002?name=展销空调-02&building=A&floorArea=1F展销大厅&deviceId=AC002
        if (random1 === 1) {
          this.$router.push({
            path: '/device/conditioning/detail/AC001',
            query: {
              name: '展销空调-01',
              building: 'A',
              floorArea: '1F展销大厅',
              deviceId: 'AC001'
            }
          })
        } else {
          this.$router.push({
            path: '/device/conditioning/detail/AC001',
            query: {
              name: '展销空调-02',
              building: 'A',
              floorArea: '1F展销大厅',
              deviceId: 'AC002'
            }
          })
        }
      } else if (this.dialogData.type === 4) {
        // #/device/lighting/detail/1?deviceId=1
        // /#/device/lighting/detail/3?deviceId=3
        if (random1 === 1) {
          this.$router.push({
            path: '/device/lighting/detail/1',
            query: {
              deviceId: '1'
            }
          })
        } else {
          this.$router.push({
            path: '/device/lighting/detail/3',
            query: {
              deviceId: '3'
            }
          })
        }
      } else if (this.dialogData.type === 5) {

      }
    },
    changeChecked (e) {
      this.checkList = e
      this.updateGroupVisibility()
    },
    async initKonva () {
      // 销毁旧实例
      if (this.konvaStage) {
        this.konvaStage.destroy()
        window.removeEventListener('resize', this.applyScale)
      }
      // 获取容器实际尺寸
      const container = this.$refs.svgDeviceContainer
      const containerWidth = container.offsetWidth
      const containerHeight = container.offsetHeight
      this.konvaStage = new Konva.Stage({
        container: container,
        width: containerWidth,
        height: containerHeight
        // draggable: true
      })
      this.layer = new Konva.Layer()
      this.konvaStage.add(this.layer)

      await this.loadKonvaSvg()
      await this.setSVG()
      this.initDeviceGroups() // 初始化设备分组
      // this.addTooltip()
      this.$nextTick(() => {
        window.addEventListener('resize', this.applyScale)
        // this.applyScale()
      })
      this.konvaStage.batchDraw()
    },
    async setSVG () {
      try {
      // 加载SVG文件内容
        const response = await fetch(this.svgPathData.default)
        const svgText = await response.text()

        // 创建SVG DOM解析器
        const parser = new DOMParser()
        const svgDoc = parser.parseFromString(svgText, 'image/svg+xml')

        // 创建Konva组并设置初始缩放
        this.svgLayer = new Konva.Layer()
        const svgGroup = new Konva.Group({
          scaleX: this.svgScale,
          scaleY: this.svgScale
        })

        // 解析路径元素
        let pathDoc = null
        svgDoc.querySelectorAll('g').forEach(gPath => {
          if (gPath.id === 'area') {
            pathDoc = gPath
          }
        })

        // 解析矩形元素
        pathDoc.querySelectorAll('rect').forEach(rect => {
          // const tempData = this.roomTemperatures[rect.id]
          svgGroup.add(new Konva.Rect({
            id: rect.id,
            x: parseFloat(rect.getAttribute('x')),
            y: parseFloat(rect.getAttribute('y')),
            width: parseFloat(rect.getAttribute('width')),
            height: parseFloat(rect.getAttribute('height'))
            // fill: tempData ? this.getTemperatureColor(tempData.temperature) : ''
            // fill: rect.getAttribute('fill'),
            // stroke: '#C1DD6E',
            // strokeWidth: 0.48
            // fillRadialGradientStartPoint: { x: parseFloat(rect.getAttribute('width')) / 2, y: parseFloat(rect.getAttribute('height')) / 2 },
            // fillRadialGradientStartRadius: 0,
            // fillRadialGradientEndPoint: { x: parseFloat(rect.getAttribute('width')) / 2, y: parseFloat(rect.getAttribute('height')) / 2 },
            // fillRadialGradientEndRadius: parseFloat(rect.getAttribute('height')) * 2,
            // fillRadialGradientColorStops: [0, '#FF4700', 0.33, '#FBF206', 0.68, '#06FF1C', 1, '#0085FF']
          }))
        })

        pathDoc.querySelectorAll('path').forEach(path => {
          // const tempData = this.roomTemperatures[path.id]
          var svgPath = new Konva.Path({
            id: path.id,
            data: path.getAttribute('d'),
            // stroke: path.getAttribute('stroke'),
            // strokeWidth: parseFloat(path.getAttribute('stroke-width') || 0.48),
            listening: true, // 启用事件监听
            hitStrokeWidth: 10, // 扩大点击区域
            name: 'svgPath' // 添加可识别名称
            // opacity: 0.6, // 透明度(0-1)
            // shadowColor: 'this.getTemperatureColor(tempData.temperature)', // 阴影颜色
            // shadowBlur: 10,
            // fill: tempData ? this.getTemperatureColor(tempData.temperature) : '' // path.getAttribute('fill'),
          })
          svgGroup.add(svgPath)
        })
        svgGroup.on('click', (e) => {
          const id = e.target.attrs.id
          // const temp = this.svgLayer.findOne('#' + id)
          console.log(id, 'click===')
          const pos = e.target.getStage().getPointerPosition()
          console.log('点击坐标:',
            `X: ${pos.x.toFixed(2)}, Y: ${pos.y.toFixed(2)}`)
          // 转换为原始SVG坐标系
          const rawX = pos.x / this.svgScale
          const rawY = pos.y / this.svgScale
          console.log('原始坐标:',
            `X: ${rawX.toFixed(2)}, Y: ${rawY.toFixed(2)}`)
        })

        // 将组添加到图层
        this.svgLayer.destroyChildren()
        this.svgLayer.add(svgGroup)
        this.konvaStage.add(this.svgLayer)
        this.konvaStage.batchDraw()

        // 触发尺寸更新
        this.$nextTick(() => {
          window.dispatchEvent(new Event('resize'))
        })
      } catch (error) {
        console.error('SVG加载失败:', error)
        this.$message.error('楼层图纸加载失败，请检查文件路径')
      }
    },
    async loadKonvaSvg () {
      try {
        const konvaImage = await new Promise((resolve, reject) => {
          Konva.Image.fromURL(this.svgPathData.default, (img) => {
            img ? resolve(img) : reject(new Error('图片加载失败'))
          })
        })
        // 获取原始SVG尺寸
        const naturalSize = {
          w: konvaImage.image().naturalWidth,
          h: konvaImage.image().naturalHeight
        }
        this.svgWidth = naturalSize.w
        this.svgHeight = naturalSize.h
        const scale = this.svgScale

        // 应用缩放并定位
        konvaImage
          .width(naturalSize.w * scale)
          .height(naturalSize.h * scale)
          .position({ x: 0, y: 0 })
          .draggable(false)

        this.layer.add(konvaImage)
        this.layer.batchDraw()

        // 触发尺寸更新
        this.$nextTick(() => {
          window.dispatchEvent(new Event('resize'))
        })
      } catch (error) {
        console.error('图片加载失败:', error)
        this.$message.error('楼层图纸加载失败')
      }
    },
    // 添加温度颜色映射函数
    getTemperatureColor (temp) {
      const hue = 240 - (temp * 2.4) // 20°C蓝色(240)到40°C红色(0)
      return `hsl(${hue}, 100%, 50%)`
    },
    applyScale () {
      // 同步应用缩放比例到svgLayer
      if (this.svgLayer) {
        this.svgLayer.scaleX(this.svgScale)
        this.svgLayer.scaleY(this.svgScale)
      }

      // 确保stage已初始化
      if (this.konvaStage) {
        this.konvaStage.width(this.$refs.svgDeviceContainer.offsetWidth)
        this.konvaStage.height(this.svgHeight * this.svgScale)
      }
      // 批量重绘优化性能
      this.svgLayer.batchDraw()
    },
    // 设备分组初始化
    initDeviceGroups () {
      this.deviceLayer = new Konva.Layer()
      this.konvaStage.add(this.deviceLayer)

      this.deviceGroups = {
        1: new Konva.Group({ name: 'electric-meter' }),
        2: new Konva.Group({ name: 'water-meter' }),
        3: new Konva.Group({ name: 'air-conditioner' }),
        4: new Konva.Group({ name: 'lighting' }),
        5: new Konva.Group({ name: 'door-lock' })
      }
      this.createDeviceIcon()
      Object.values(this.deviceGroups).forEach(group => {
        this.deviceLayer.add(group)
      })
      this.deviceLayer.batchDraw()
      this.updateGroupVisibility()
    },
    // 创建设备时分配分组
    createDeviceIcon () {
      this.devices.forEach(device => {
        let imgUrl = ''
        const patternImage = new Image()
        if (device.type === 1) {
          if (device && device.status === 'err') {
            imgUrl = require('@/assets/images/floors/elec-abnor.png')
            patternImage.src = require('@/assets/images/floors/elec-sel.png')
          } else {
            imgUrl = require('@/assets/images/floors/elec-nor.png')
            patternImage.src = require('@/assets/images/floors/elec-sel.png')
          }
        } else if (device.type === 2) {
          imgUrl = require('@/assets/images/floors/water-nor.png')
          patternImage.src = require('@/assets/images/floors/water-sel.png')
        } else if (device.type === 3) {
          imgUrl = require('@/assets/images/floors/air-nor.png')
          patternImage.src = require('@/assets/images/floors/air-sel.png')
        } else if (device.type === 4) {
          imgUrl = require('@/assets/images/floors/light-nor.png')
          patternImage.src = require('@/assets/images/floors/light-sel.png')
        } else if (device.type === 5) {
          imgUrl = require('@/assets/images/floors/lock-nor.png')
          patternImage.src = require('@/assets/images/floors/lock-sel.png')
        }
        Konva.Image.fromURL(imgUrl, (darthNode) => {
          darthNode.setAttrs({
            x: device.X,
            y: device.Y,
            width: 28, // 添加尺寸约束
            height: 28,
            listening: true, // 启用事件监听
            deviceData: device // 绑定设备数据
          })
          darthNode.on('click', (e) => {
            const clickedDevice = e.target.getAttr('deviceData')
            console.log('点击设备:', e.target, clickedDevice)
            if (this.dialogData && this.dialogData.pathId) {
              this.setAreaColor('white')
            }
            this.dialogData = clickedDevice
            this.setAreaColor('#CDFFE3') // #00FF6E #CDFFE3
            // 添加点击反馈效果
            e.target.fill('#0170FE')
            e.target.stroke('#0170FE')
            e.target.strokeWidth(2)
            this.deviceLayer.batchDraw()

            const pos = darthNode.getAbsolutePosition()
            const stageRect = this.$refs.svgDeviceContainer.getBoundingClientRect()

            this.dialogPosition = {
              x: pos.x + stageRect.left + 24, // 24为图标宽度
              y: pos.y + stageRect.top - 10
            }
            this.adjustPosition(this.dialogPosition)
            this.dialogVisible = true

            setTimeout(() => {
              e.target.stroke(null)
              e.target.fill('transparent')
              this.deviceLayer.batchDraw()
            }, 200)
          })
          if (this.deviceGroups[device.type]) {
            this.deviceGroups[device.type].add(darthNode)
            this.deviceLayer.batchDraw()
          } else {
            console.error('设备组未初始化:', device.type)
          }
        })
      })
    },
    setAreaColor (color) {
      const areaPath = this.konvaStage.findOne('#' + this.dialogData.pathId)
      if (areaPath) {
        areaPath.fill(color)
        this.svgLayer.batchDraw()
      }
    },
    adjustPosition (pos) {
      const dialogWidth = 300
      if (pos.x + dialogWidth > window.innerWidth) {
        pos.x = window.innerWidth - dialogWidth - 20
      }
      return pos
    },
    // 更新分组可见性
    updateGroupVisibility () {
      this.checkList.forEach(type => {
        this.deviceGroups[type].visible(true)
      })
      Object.entries(this.deviceGroups).forEach(([type, group]) => {
        if (!this.checkList.includes(Number(type))) {
          group.visible(false)
        }
      })
      this.deviceLayer.batchDraw()
    }
  }
}
</script>

<style lang="scss" scoped>
.device-Container {
  width: 100%;
  background-color: #fff;
  .title {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    .note {
      background-color: #0170FE;
      height: 15px;
      width: 2px;
      margin-right: 4px;
    }
    .txt {
      color: #000000;
      font-size: 16px;
    }
  }
  .type-list {
    margin-bottom: 13px;
  }
  .device-wrapper {
    width: 100%;
    height: 561px;
  }
}
.dialog-arrow {
  position: absolute;
  left: -10px;
  top: 50%;
  border-width: 10px 10px 10px 0;
  border-color: transparent #fff transparent transparent;
}
.txt-blue {
  color: #0052D9 !important;
}
</style>
<style lang="scss" scoped>
.dialog-header {
  padding: 6px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  .l {
    display: flex;
    align-items: center;
    .img {
      width: 32px;
      height: 32px;
    }
    .info {
      margin-left: 8px;
      .label-1 {
        font-weight: 500;
        font-size: 16px;
        color: #000000;
        line-height: 22px;
      }
      .label-2 {
        font-size: 12px;
        color: #999999;
        line-height: 22px;
      }
    }
  }
  .r {
    display: flex;
    align-items: center;
    justify-content: space-between;
    .status-item {
      width: 40px;
      height: 24px;
      line-height: 24px;
      text-align: center;
      border-radius: 3px;
      border: 1px solid;
      font-size: 12px;
      margin-right: 10px;
      &:last-child {
        margin-right: 0;
      }
    }
    .status-item-green {
      color: #2BA471;
      border-color: #2BA471;
    }
    .status-item-blue {
      color: #0052D9;
      border-color: #0052D9;
    }
    .status-item-red {
      color: #FF383C;
      border-color: #FF383C;
    }
  }
}
.dialog-content {
  padding: 16px 30px;
  border-top: 1px solid rgba(0,0,0,0.12);
  border-bottom: 1px solid rgba(0,0,0,0.12);
  .item {
    display: flex;
    justify-content: space-between;
    .label-1 {
      font-size: 14px;
      color: #666666;
      line-height: 22px;
    }
    .label-2 {
      font-size: 14px;
      color: #333333;
      line-height: 22px;
    }
  }
}
.dialog-footer {
  display: flex;
  align-items: center;
  padding: 18px 0;
  .footer-item {
    padding: 0px 16px;
    display: flex;
    align-items: center;
    border-right: 1px solid rgba(0,0,0,0.12);
    &:last-child {
      border-right: 0;
    }
    .img {
      height: 18px;
      width: 18px;
    }
    .label {
      margin-left: 8px;
      font-size: 14px;
      color: #999999;
    }
    .act-label {
      color: #0170FE;
    }
  }
}
</style>
<style lang="scss">
.device-Container {
.el-dialog {
  margin: 0 !important;
  .el-dialog__body {
    padding: 0;
  }
}
}
</style>
