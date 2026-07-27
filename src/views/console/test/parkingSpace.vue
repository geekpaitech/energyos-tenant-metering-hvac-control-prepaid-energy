<template>
  <div class="parking-space-page">
    <div v-if="!enableParkingSpace" class="empty-page">
      <i class="el-icon-data-analysis empty-icon"></i>
      <div class="empty-title">暂无数据</div>
      <div class="empty-desc">车位可视化数据暂未接入</div>
    </div>
    <div v-else ref="carContainer" class="car-wrapper"></div>
  </div>
</template>

<script>
import Konva from 'konva'
export default {
  data () {
    return {
      SOURCE: require('@/assets/images/floors/A8.svg'),
      enableParkingSpace: false,
      konvaStage: null,
      layer: null,
      svgLayer: null,
      tooltipLayer: null,
      tooltip: null,
      svgGroup: null,
      bgImage: null,
      svgWidth: 1191,
      svgHeight: 1684,
      svgScale: 1,
      parkingSlots: [
      ]
    }
  },
  mounted () {
    if (this.enableParkingSpace) {
      this.initKonva()
    }
  },
  beforeDestroy () {
    if (this.enableParkingSpace) {
      window.removeEventListener('resize', this.applyScale)
    }
    if (this.konvaStage) {
      this.konvaStage.destroy()
    }
  },
  methods: {
    applyScale () {
      if (!this.konvaStage || !this.$refs.carContainer || !this.svgWidth || !this.svgHeight) return

      const container = this.$refs.carContainer
      const containerWidth = container.offsetWidth
      const containerHeight = container.offsetHeight

      if (!containerWidth || !containerHeight) return

      const nextScale = Math.min(containerWidth / this.svgWidth, containerHeight / this.svgHeight)
      this.svgScale = nextScale

      this.konvaStage.size({ width: containerWidth, height: containerHeight })

      if (this.bgImage) {
        this.bgImage.width(this.svgWidth * nextScale)
        this.bgImage.height(this.svgHeight * nextScale)
      }

      if (this.svgGroup) {
        this.svgGroup.scale({ x: nextScale, y: nextScale })
      }

      this.konvaStage.batchDraw()
    },
    async initKonva () {
      if (this.konvaStage) {
        this.konvaStage.destroy()
        window.removeEventListener('resize', this.applyScale)
      }
      const container = this.$refs.carContainer
      const containerWidth = container.offsetWidth
      const containerHeight = container.offsetHeight
      this.konvaStage = new Konva.Stage({
        container: container,
        width: containerWidth,
        height: containerHeight
      })
      this.layer = new Konva.Layer()
      this.konvaStage.add(this.layer)

      await this.loadKonvaSvg()
      await this.setSVG()
      this.addTooltip()
      this.$nextTick(() => {
        window.addEventListener('resize', this.applyScale)
        this.applyScale()
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

        const naturalSize = {
          w: konvaImage.image().naturalWidth,
          h: konvaImage.image().naturalHeight
        }
        this.svgWidth = naturalSize.w
        this.svgHeight = naturalSize.h
        const scale = this.svgScale

        konvaImage
          .width(naturalSize.w * scale)
          .height(naturalSize.h * scale)
          .position({ x: 0, y: 0 })
          .draggable(false)

        this.bgImage = konvaImage
        this.layer.add(konvaImage)
        this.layer.batchDraw()

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
        const response = await fetch(this.SOURCE.default)
        const svgText = await response.text()

        const parser = new DOMParser()
        const svgDoc = parser.parseFromString(svgText, 'image/svg+xml')

        if (!this.svgLayer) {
          this.svgLayer = new Konva.Layer()
          this.konvaStage.add(this.svgLayer)
        }

        const svgGroup = new Konva.Group({
          scaleX: this.svgScale,
          scaleY: this.svgScale
        })
        this.svgGroup = svgGroup

        const pathDoc = svgDoc

        pathDoc.querySelectorAll('rect').forEach(rect => {
          svgGroup.add(new Konva.Rect({
            id: rect.id,
            x: parseFloat(rect.getAttribute('x')),
            y: parseFloat(rect.getAttribute('y')),
            width: parseFloat(rect.getAttribute('width')),
            height: parseFloat(rect.getAttribute('height')),
            fill: rect.getAttribute('fill')
          }))
        })

        pathDoc.querySelectorAll('path').forEach(path => {
          const svgPath = new Konva.Path({
            id: path.id,
            data: path.getAttribute('d'),
            fill: path.getAttribute('fill'),
            stroke: path.getAttribute('stroke'),
            strokeWidth: parseFloat(path.getAttribute('stroke-width') || 0.48),
            lineJoin: path.getAttribute('stroke-linejoin'),
            lineCap: path.getAttribute('stroke-linecap'),
            miterLimit: path.getAttribute('stroke-miterlimit'),
            listening: true,
            hitStrokeWidth: 10,
            name: 'svgPath'
          })
          svgGroup.add(svgPath)
        })
        svgGroup.on('mousemove', (e) => {
          const id = e.target && e.target.attrs ? e.target.attrs.id : ''
          const fillColor = e.target && e.target.attrs ? e.target.attrs.fill : ''
          if (!fillColor || !this.tooltip || !this.tooltipLayer) return

          const pos = e.target.getStage().getPointerPosition()
          if (!pos) return

          const rawX = pos.x / this.svgScale
          const rawY = pos.y / this.svgScale

          this.updateTooltip(rawX, rawY, fillColor, id)
          this.tooltipLayer.batchDraw()
        })
        svgGroup.on('mouseout', () => {
          this.tooltip.hide()
          this.tooltipLayer.draw()
        })
        this.svgLayer.destroyChildren()
        this.svgLayer.add(svgGroup)
        this.konvaStage.batchDraw()
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
      } else if (fillColor === '#2D2D2D') {
        text = '充电桩车位'
      } else if (fillColor === '#808080') {
        text = '残障车位'
      } else if (fillColor === '#F0A49E') {
        text = '不可用车位'
      }
      if (text) {
        text = (id ? (id + '\n') : '') + text
        this.tooltip.getText().text(text)
        this.tooltip.position({ x, y })
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
.parking-space-page {
  width: 100%;
  height: 100%;
}

.car-wrapper {
  width: 100%;
  height: 100vh;
}

.empty-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #ffffff;
}

.empty-icon {
  font-size: 64px;
  color: #c0c4cc;
  margin-bottom: 12px;
}

.empty-title {
  font-size: 16px;
  color: #303133;
  margin-bottom: 6px;
}

.empty-desc {
  font-size: 13px;
  color: #909399;
}
</style>
