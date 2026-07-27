<template>
  <div ref="wrapper" class="screen-scale-wrapper">
    <div class="screen-scale-inner" :style="innerStyle">
      <slot />
    </div>
  </div>
</template>

<script>
const DESIGN_WIDTH = 1920
const DESIGN_HEIGHT = 1080

export default {
  name: 'ScreenScale',
  props: {
    /**
     * stretch - 宽高独立缩放，始终 100% 铺满视口（大屏投放推荐，零留白）
     * fill    - 等比铺满，非 16:9 时裁边
     * fit     - 等比完整显示，非 16:9 时留白
     */
    mode: {
      type: String,
      default: 'stretch',
      validator: v => ['fit', 'fill', 'stretch'].includes(v)
    }
  },
  data () {
    return {
      scale: 1,
      scaleX: 1,
      scaleY: 1,
      offsetX: 0,
      offsetY: 0
    }
  },
  computed: {
    innerStyle () {
      if (this.mode === 'stretch') {
        return {
          width: `${DESIGN_WIDTH}px`,
          height: `${DESIGN_HEIGHT}px`,
          transform: `scale(${this.scaleX}, ${this.scaleY})`,
          transformOrigin: '0 0'
        }
      }
      return {
        width: `${DESIGN_WIDTH}px`,
        height: `${DESIGN_HEIGHT}px`,
        transform: `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`,
        transformOrigin: '0 0'
      }
    }
  },
  mounted () {
    this.updateScale()
    window.addEventListener('resize', this.updateScale)
    document.addEventListener('fullscreenchange', this.updateScale)
    this._raf = requestAnimationFrame(() => {
      this.updateScale()
      requestAnimationFrame(this.updateScale)
    })
    if (typeof ResizeObserver !== 'undefined') {
      this._ro = new ResizeObserver(() => this.updateScale())
      this._ro.observe(this.$refs.wrapper)
    }
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.updateScale)
    document.removeEventListener('fullscreenchange', this.updateScale)
    if (this._raf) cancelAnimationFrame(this._raf)
    if (this._ro) {
      this._ro.disconnect()
      this._ro = null
    }
  },
  methods: {
    getViewportSize () {
      // 大屏统一用 window 视口，避免父级容器宽度不准导致缩放偏小、两侧留白
      return {
        width: window.innerWidth,
        height: window.innerHeight
      }
    },
    updateScale () {
      const { width: clientWidth, height: clientHeight } = this.getViewportSize()
      if (!clientWidth || !clientHeight) return

      const scaleX = clientWidth / DESIGN_WIDTH
      const scaleY = clientHeight / DESIGN_HEIGHT

      if (this.mode === 'stretch') {
        this.scaleX = scaleX
        this.scaleY = scaleY
        this.scale = Math.min(scaleX, scaleY)
        this.offsetX = 0
        this.offsetY = 0
      } else {
        this.scale = this.mode === 'fill'
          ? Math.max(scaleX, scaleY)
          : Math.min(scaleX, scaleY)

        const scaledWidth = DESIGN_WIDTH * this.scale
        const scaledHeight = DESIGN_HEIGHT * this.scale

        this.offsetX = (clientWidth - scaledWidth) / 2
        this.offsetY = (clientHeight - scaledHeight) / 2
        this.scaleX = this.scale
        this.scaleY = this.scale
      }

      this.$emit('scale-change', this.scale)
    }
  }
}
</script>

<style scoped lang="scss">
@import '../styles/design-system.scss';

.screen-scale-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  background: $ds-bg-main;
}

.screen-scale-inner {
  position: absolute;
  top: 0;
  left: 0;
  /* 不设 will-change/backface-visibility：避免整屏被提升为合成层后
     文字按 1× 栅格化再由 GPU 拉伸（非 1080p 设备上会发虚） */
}
</style>
