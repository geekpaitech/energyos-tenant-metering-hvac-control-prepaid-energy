<template>
  <div class="device-Container">
    <div class="title">
      <div class="note"></div>
      <div class="txt">温度热力图</div>
    </div>
    <div class="heat-map">
      <div ref="svgTemperatureContainer" class="device-wrapper">
      </div>
      <div class="bar">
        <div class="bar-label">
          <div class="val">50℃</div>
          <div class="val">40℃</div>
          <div class="val">30℃</div>
          <div class="val">20℃</div>
          <div class="val">10℃</div>
        </div>
        <div class="bar-rect"></div>
      </div>
    </div>
  </div>
</template>

<script>
import Konva from 'konva'
export default {
  data () {
    return {
      konvaStage: null,
      layer: null,
      svgLayer: null,
      svgPathData: require('@/assets/images/floors/Temperature.svg'),
      svgWidth: 442,
      svgHeight: 203,
      // svgScale: 1,
      roomTemperatures: {
        'area-a': { temperature: 25 },
        'area-b': { temperature: 32 },
        'area-c': { temperature: 42 },
        'air-ex01': { temperature: 12 }
        // 'elec-s': { temperature: 40 },
        // 'lift-goods': { temperature: 20 },
        // 'lift-peo': { temperature: 20 },
        // open: { temperature: 42 },
        // 'elec-r': { temperature: 20 },
        // 'wc-free': { temperature: 20 },
        // 'wc-wo': { temperature: 32 },
        // 'wc-men': { temperature: 32 }
      }
    }
  },
  computed: {
    svgScale () {
      const containerWidth = this.$refs.svgTemperatureContainer?.offsetWidth || this.svgWidth
      return containerWidth / this.svgWidth // 基于SVG原始宽度1149计算
    }
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
    async initKonva () {
      // 销毁旧实例
      if (this.konvaStage) {
        this.konvaStage.destroy()
        window.removeEventListener('resize', this.applyScale)
      }
      // 获取容器实际尺寸
      const container = this.$refs.svgTemperatureContainer
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
          const tempData = this.roomTemperatures[rect.id]
          svgGroup.add(new Konva.Rect({
            id: rect.id,
            x: parseFloat(rect.getAttribute('x')),
            y: parseFloat(rect.getAttribute('y')),
            width: parseFloat(rect.getAttribute('width')),
            height: parseFloat(rect.getAttribute('height')),
            opacity: 0.8, // 透明度(0-1)
            shadowColor: tempData ? this.getTemperatureColor(tempData.temperature) : rect.getAttribute('fill'), // 阴影颜色
            shadowBlur: 2, // 10,
            fill: tempData ? this.getTemperatureColor(tempData.temperature) : rect.getAttribute('fill')

          }))
        })

        pathDoc.querySelectorAll('path').forEach(path => {
          const tempData = this.roomTemperatures[path.id]
          var svgPath = new Konva.Path({
            id: path.id,
            data: path.getAttribute('d'),
            listening: true, // 启用事件监听
            hitStrokeWidth: 10, // 扩大点击区域
            name: 'svgPath', // 添加可识别名称
            opacity: 0.8, // 透明度(0-1)
            shadowColor: tempData ? this.getTemperatureColor(tempData.temperature) : path.getAttribute('fill'), // 阴影颜色
            shadowBlur: 2, // 10,
            fill: tempData ? this.getTemperatureColor(tempData.temperature) : path.getAttribute('fill')
          })
          svgGroup.add(svgPath)
        })
        svgGroup.on('click', (e) => {
          const clickedPath = e.target.attrs.id
          // console.log(clickedPath, 'click===')
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
        // console.error('SVG加载失败:', error)
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
        // console.error('图片加载失败:', error)
        this.$message.error('楼层图纸加载失败')
      }
    },
    // 添加温度颜色映射函数
    getTemperatureColor (temp) {
      if (temp >= 40) return '#FF4700'
      if (temp >= 30) return '#FBF206'
      if (temp >= 20) return '#06FF1C'
      if (temp >= 10) return '#0085FF'
      return '#fff'
    },
    applyScale () {
      // 同步应用缩放比例到svgLayer
      if (this.svgLayer) {
        this.svgLayer.scaleX(this.svgScale)
        this.svgLayer.scaleY(this.svgScale)
      }

      // 确保stage已初始化
      if (this.konvaStage) {
        this.konvaStage.width(this.$refs.svgTemperatureContainer.offsetWidth)
        this.konvaStage.height(this.svgHeight * this.svgScale)
      }
      // 批量重绘优化性能
      this.svgLayer.batchDraw()
    }
  }
}
</script>

<style lang="scss" scoped>
.device-Container {
  margin-top: 33px;
  padding-bottom: 20px;
  .title {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
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
  .device-wrapper {
    width: 100%;
    // height: 561px;
  }
  .heat-map {
    // width: 560px;
    position: relative;
    display: flex;
    justify-content: space-between;
    .device-wrapper {
      width: 440px;
    }
    .bar {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      .bar-label {
        margin-right: 16px;
        width: 23px;
        height: 200px;
        .val {
          font-size: 12px;
          color: #666666;
          margin-bottom: 32px;
          &:last-child {
            margin-bottom: 0;
          }
        }
      }
      .bar-rect {
        width: 23px;
        height: 200px;
        background: linear-gradient( 180deg, #FF4700 0%, #FBF206 33%, #06FF1C 68%, #0085FF 100%);
        border-radius: 0px 0px 0px 0px;
      }
    }
  }
}
</style>
