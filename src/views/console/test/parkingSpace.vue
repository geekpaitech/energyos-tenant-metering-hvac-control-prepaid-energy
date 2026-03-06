<template>
  <div ref="carContainer" class="car-wrapper"></div>
</template>

<script>
import Konva from 'konva'
export default {
  data () {
    return {
      SOURCE: require('@/assets/images/floors/A8.svg'),
      konvaStage: null,
      layer: null,
      svgLayer: null,
      tooltipLayer: null,
      tooltip: null,
      svgWidth: 1191,
      svgHeight: 1684,
      svgScale: 1,
      parkingSlots: [
        // {
        //   id: 'A01',
        //   x: 50,
        //   y: 100,
        //   status: 'available', // available/occupied/reserved
        //   type: 'compact'
        // }
        // 更多车位数据...
      ]
    }
  },
  computed: {
    // svgScale () {
    //   const containerWidth = this.$refs.svgEnergyContainer?.offsetWidth || this.svgWidth
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
    async initKonva () {
      // 销毁旧实例
      if (this.konvaStage) {
        this.konvaStage.destroy()
        window.removeEventListener('resize', this.applyScale)
      }
      // 获取容器实际尺寸
      const container = this.$refs.carContainer
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
      // this.initDeviceGroups() // 初始化设备分组
      this.addTooltip()
      this.$nextTick(() => {
        window.addEventListener('resize', this.applyScale)
        // this.applyScale()
      })
      this.konvaStage.batchDraw()
    },
    async loadKonvaSvg () {
      try {
        const konvaImage = await new Promise((resolve, reject) => {
          Konva.Image.fromURL(this.SOURCE.default, (img) => {
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
    async setSVG () {
      try {
      // 加载SVG文件内容
        const response = await fetch(this.SOURCE.default)
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
        const pathDoc = svgDoc

        // 解析矩形元素
        pathDoc.querySelectorAll('rect').forEach(rect => {
          svgGroup.add(new Konva.Rect({
            id: rect.id,
            x: parseFloat(rect.getAttribute('x')),
            y: parseFloat(rect.getAttribute('y')),
            width: parseFloat(rect.getAttribute('width')),
            height: parseFloat(rect.getAttribute('height')),
            fill: rect.getAttribute('fill')
            // stroke: '#C1DD6E',
            // strokeWidth: 0.48
          }))
        })

        pathDoc.querySelectorAll('path').forEach(path => {
          var svgPath = new Konva.Path({
            id: path.id,
            data: path.getAttribute('d'),
            fill: path.getAttribute('fill'),
            stroke: path.getAttribute('stroke'),
            strokeWidth: parseFloat(path.getAttribute('stroke-width') || 0.48),
            lineJoin: path.getAttribute('stroke-linejoin'),
            lineCap: path.getAttribute('stroke-linecap'),
            miterLimit: path.getAttribute('stroke-miterlimit'),
            listening: true, // 启用事件监听
            hitStrokeWidth: 10, // 扩大点击区域
            name: 'svgPath' // 添加可识别名称
            // opacity: 0.6, // 透明度(0-1)
            // shadowColor: 'this.getTemperatureColor(tempData.temperature)', // 阴影颜色
            // shadowBlur: 10,

          })
          svgGroup.add(svgPath)
        })
        svgGroup.on('mousemove', (e) => {
          const id = e.target.attrs.id
          // const temp = this.svgLayer.findOne('#' + id)

          var shape = e.target
          const fillColor = e.target.attrs.fill
          if (shape && fillColor) {
            console.log(id, e.target.attrs.fill, 'click===')
            const pos = e.target.getStage().getPointerPosition()
            // 转换为原始SVG坐标系
            const rawX = pos.x / this.svgScale
            const rawY = pos.y / this.svgScale
            // var mousePos = e.target.getStage().getPointerPosition()
            // var x = mousePos.x
            // var y = mousePos.y - 5
            this.updateTooltip(rawX, rawY, fillColor, id)
            this.tooltipLayer.batchDraw()
          }
        })
        svgGroup.on('mouseout', (e) => {
          this.tooltip.hide()
          this.tooltipLayer.draw()
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
    updateTooltip (x, y, fillColor, id) {
      let text = ''
      if (fillColor === '#89BC6F') {
        text = '可用车位'
      } else if (fillColor === '#89BC6F') {
        text = '不可用车位'
      } else if (fillColor === '#2D2D2D' || fillColor === '#89BC6F') {
        text = '充电桩车位'
      } else if (fillColor === '#808080' || fillColor === '#89BC6F') {
        text = '残障车位'
      } else if (fillColor === '#F0A49E' || fillColor === '#89BC6F') {
        text = '不可用车位'
      }
      // hello world\n丙类厂房
      if (text) {
        text = id + '\n' + text
        this.tooltip.getText().text(text)
        this.tooltip.position({
          x: x,
          y: y
        })
        this.tooltip.show()
      }
    },
    addTooltip () {
      this.tooltipLayer = new Konva.Layer()
      this.tooltip = new Konva.Label({
        x: 500,
        y: 400,
        opacity: 0.75,
        visible: false,
        listening: false
      })

      this.tooltip.add(
        new Konva.Tag({
          fill: 'black',
          pointerDirection: 'down',
          pointerWidth: 10,
          pointerHeight: 10,
          lineJoin: 'round',
          shadowColor: 'black',
          shadowBlur: 10,
          shadowOffsetX: 10,
          shadowOffsetY: 10,
          shadowOpacity: 0.5
        })
      )
      this.tooltip.add(
        new Konva.Text({
          text: '',
          fontFamily: 'Calibri',
          fontSize: 18,
          padding: 5,
          fill: 'white'
        })
      )
      this.tooltipLayer.add(this.tooltip)
      this.konvaStage.add(this.tooltipLayer)
      this.tooltipLayer.draw()
    }
  }
}
</script>
<style lang="scss" scoped>
.car-wrapper {
  width: 100%;
  height: 100vh;
}
</style>
